<script lang="ts">
	import { useDocumentState } from '@embedpdf/core/svelte';
	import { useAnnotation } from '@embedpdf/plugin-annotation/svelte';
	import { PdfAnnotationSubtype } from '@embedpdf/models';
	import { naturalPenStore } from '../store.svelte';

	interface Props {
		documentId: string;
		pageIndex: number;
	}
	let { documentId, pageIndex }: Props = $props();

	const documentState = useDocumentState(() => documentId);
	const scale = $derived(documentState.current?.scale ?? 1);
	const annotation = useAnnotation(() => documentId);

	let pageEl = $state<HTMLDivElement | null>(null);
	let activePointerId: number | null = null;
	let points = $state<{ x: number; y: number }[]>([]);
	let drawing = $state(false);

	const SMOOTHING = 0.4;
	let smoothX = 0;
	let smoothY = 0;

	function toPagePoint(clientX: number, clientY: number) {
		const box = pageEl?.getBoundingClientRect();
		if (!box) return { x: 0, y: 0 };
		return { x: (clientX - box.left) / scale, y: (clientY - box.top) / scale };
	}

	function addRawPoint(clientX: number, clientY: number) {
		const p = toPagePoint(clientX, clientY);
		if (points.length === 0) {
			smoothX = p.x;
			smoothY = p.y;
		} else {
			smoothX += SMOOTHING * (p.x - smoothX);
			smoothY += SMOOTHING * (p.y - smoothY);
		}
		points.push({ x: smoothX, y: smoothY });
	}

	function handlePointerDown(e: PointerEvent) {
		if (!naturalPenStore.active) return;
		if (activePointerId !== null) return;
		e.preventDefault();
		e.stopPropagation();
		activePointerId = e.pointerId;
		drawing = true;
		points = [];
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		addRawPoint(e.clientX, e.clientY);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!drawing || e.pointerId !== activePointerId) return;
		e.preventDefault();
		e.stopPropagation();
		const events = e.getCoalescedEvents?.() ?? [e];
		for (const ev of events) addRawPoint(ev.clientX, ev.clientY);
	}

	function handlePointerUp(e: PointerEvent) {
		if (!drawing || e.pointerId !== activePointerId) return;
		activePointerId = null;
		drawing = false;

		if (points.length >= 2) {
			const xs = points.map((p) => p.x);
			const ys = points.map((p) => p.y);
			const pad = naturalPenStore.width;
			const minX = Math.min(...xs) - pad;
			const minY = Math.min(...ys) - pad;
			const maxX = Math.max(...xs) + pad;
			const maxY = Math.max(...ys) + pad;

			annotation.provides?.createAnnotation(pageIndex, {
				id: crypto.randomUUID(),
				type: PdfAnnotationSubtype.INK,
				pageIndex,
				rect: { origin: { x: minX, y: minY }, size: { width: maxX - minX, height: maxY - minY } },
				inkList: [{ points }],
				strokeColor: naturalPenStore.color,
				opacity: 1,
				strokeWidth: naturalPenStore.width
			});
		}
		points = [];
	}

	const previewPath = $derived(
		points.length < 2
			? ''
			: points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x * scale} ${p.y * scale}`).join(' ')
	);
</script>

<div
	bind:this={pageEl}
	style="position:absolute; inset:0; z-index:40; touch-action:none; -webkit-user-select:none; user-select:none; -webkit-user-drag:none; {naturalPenStore.active
		? 'cursor:crosshair; pointer-events:auto;'
		: 'pointer-events:none;'}"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	onpointercancel={handlePointerUp}
	role="presentation"
>
	{#if drawing && previewPath}
		<svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;">
			<path
				d={previewPath}
				fill="none"
				stroke={naturalPenStore.color}
				stroke-width={naturalPenStore.width * scale}
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>
	{/if}
</div>
