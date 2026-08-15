<script lang="ts">
	import { useDocumentState } from '@embedpdf/core/svelte';
	import { zbookStore } from '../store.svelte';
	import type { ZBookInteraction } from '../types';
	import type { Rect } from '@embedpdf/models';
	import EtkinlikModal from './EtkinlikModal.svelte';
	import InteractionEditForm from './InteractionEditForm.svelte';

	interface Props {
		documentId: string;
		pageIndex: number; // 0-tabanlı (EmbedPDF konvansiyonu)
	}

	let { documentId, pageIndex }: Props = $props();

	// AŞAMA 6 formülü — EmbedPDF'in kendi annotation motoruyla birebir aynı:
	// piksel = pdf-nokta-koordinatı * scale (bkz. plugin-annotation/PreviewRenderer.svelte)
	const documentState = useDocumentState(() => documentId);
	const scale = $derived(documentState.current?.scale ?? 1);

	const pageNumber = $derived(pageIndex + 1); // bizim şema 1-tabanlı
	const interactions = $derived(zbookStore.interactionsForPage(documentId, pageNumber));

	function styleFor(rect: Rect) {
		return `position:absolute; left:${rect.origin.x * scale}px; top:${rect.origin.y * scale}px; width:${rect.size.width * scale}px; height:${rect.size.height * scale}px; pointer-events:auto;`;
	}

	let activeModal = $state<ZBookInteraction | null>(null);

	// AŞAMA 9: Cevap Alanı — mevcut cevabı bul/oluştur, değişince kalıcı kaydet.
	function answerValue(i: ZBookInteraction): string {
		return (
			zbookStore.answersForPage(documentId, i.pageNumber).find((a) => a.id === i.id)?.value ?? ''
		);
	}
	function saveAnswer(i: ZBookInteraction, value: string) {
		zbookStore.saveAnswer({
			id: i.id,
			bookId: documentId,
			pageNumber: i.pageNumber,
			rect: i.rect,
			value,
			updatedAt: new Date().toISOString()
		});
	}

	function handleButonClick(i: ZBookInteraction) {
		const href = i.config?.href as string | undefined;
		if (href) window.open(href, '_blank', 'noopener');
		else activeModal = i;
	}

	// Harf ızgarası: her hücreyi eşit genişlikte, rect içinde yan yana diz.
	function gridCellRect(i: ZBookInteraction, index: number): Rect {
		const cells = (i.config?.cells as string[]) ?? [];
		const cellWidth = i.rect.size.width / Math.max(cells.length, 1);
		return {
			origin: { x: i.rect.origin.x + index * cellWidth, y: i.rect.origin.y },
			size: { width: cellWidth, height: i.rect.size.height }
		};
	}
	function setGridCell(i: ZBookInteraction, index: number, value: string) {
		const cells = [...((i.config?.cells as string[]) ?? [])];
		cells[index] = value.slice(-1); // tek karakter
		zbookStore.addInteraction({ ...i, config: { ...i.config, cells } });
	}

	// Cevabı göster: tıklayınca aç/kapa.
	let revealedIds = $state<Set<string>>(new Set());
	function toggleReveal(id: string) {
		revealedIds = new Set(revealedIds);
		if (revealedIds.has(id)) revealedIds.delete(id);
		else revealedIds.add(id);
		revealedIds = new Set(revealedIds);
	}

	// --- AŞAMA 16: Editör modu — sürükleyerek dikdörtgen çizme ---
	let dragStart = $state<{ x: number; y: number } | null>(null);
	let dragRectPx = $state<{ x: number; y: number; w: number; h: number } | null>(null);
	let draftRect = $state<Rect | null>(null);
	let pageEl = $state<HTMLDivElement | null>(null);

	function toPagePoint(clientX: number, clientY: number) {
		const box = pageEl?.getBoundingClientRect();
		if (!box) return { x: 0, y: 0 };
		return { x: (clientX - box.left) / scale, y: (clientY - box.top) / scale };
	}

	function handlePointerDown(e: PointerEvent) {
		if (!zbookStore.editMode) return;
		if (e.target !== e.currentTarget) return; // mevcut bir widget'a tıklandı, çizim başlatma
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragStart = toPagePoint(e.clientX, e.clientY);
		dragRectPx = { x: e.offsetX, y: e.offsetY, w: 0, h: 0 };
	}
	function handlePointerMove(e: PointerEvent) {
		if (!zbookStore.editMode || !dragStart) return;
		const cur = toPagePoint(e.clientX, e.clientY);
		const x = Math.min(dragStart.x, cur.x);
		const y = Math.min(dragStart.y, cur.y);
		const w = Math.abs(cur.x - dragStart.x);
		const h = Math.abs(cur.y - dragStart.y);
		dragRectPx = { x: x * scale, y: y * scale, w: w * scale, h: h * scale };
	}
	function handlePointerUp(e: PointerEvent) {
		if (!zbookStore.editMode || !dragStart) return;
		const cur = toPagePoint(e.clientX, e.clientY);
		const x = Math.min(dragStart.x, cur.x);
		const y = Math.min(dragStart.y, cur.y);
		const w = Math.abs(cur.x - dragStart.x);
		const h = Math.abs(cur.y - dragStart.y);
		dragStart = null;
		dragRectPx = null;
		if (w < 10 / scale || h < 10 / scale) return; // çok küçük, saymıyoruz
		draftRect = { origin: { x, y }, size: { width: w, height: h } };
	}
</script>

<div
	bind:this={pageEl}
	style="position:absolute; inset:0; {zbookStore.editMode
		? 'cursor:crosshair; pointer-events:auto;'
		: 'pointer-events:none;'}"
	onpointerdown={handlePointerDown}
	onpointermove={handlePointerMove}
	onpointerup={handlePointerUp}
	role="presentation"
>
	{#if dragRectPx}
		<div
			style="position:absolute; left:{dragRectPx.x}px; top:{dragRectPx.y}px; width:{dragRectPx.w}px; height:{dragRectPx.h}px; border:2px dashed #2563eb; background:rgba(37,99,235,0.1); pointer-events:none;"
		></div>
	{/if}

	{#each interactions as interaction (interaction.id)}
		{#if interaction.kind === 'mercek'}
			<button
				type="button"
				style={styleFor(interaction.rect)}
				class="flex min-h-10 min-w-10 items-center justify-center rounded-md border-2 border-amber-400 bg-amber-100/40 text-amber-700 shadow-sm transition hover:bg-amber-100/70"
				title={(interaction.config?.label as string) ?? 'Etkinliği büyüt'}
				onclick={() => (activeModal = interaction)}
			>
				<span class="text-lg leading-none">🔍</span>
			</button>
		{:else if interaction.kind === 'video'}
			<button
				type="button"
				style={styleFor(interaction.rect)}
				class="flex min-h-10 min-w-10 items-center justify-center rounded-md border-2 border-rose-400 bg-rose-100/40 text-rose-700 shadow-sm transition hover:bg-rose-100/70"
				title={(interaction.config?.label as string) ?? 'Videoyu oynat'}
				onclick={() => (activeModal = interaction)}
			>
				<span class="text-lg leading-none">🎬</span>
			</button>
		{:else if interaction.kind === 'audio'}
			<button
				type="button"
				style={styleFor(interaction.rect)}
				class="flex min-h-10 min-w-10 items-center justify-center rounded-md border-2 border-purple-400 bg-purple-100/40 text-purple-700 shadow-sm transition hover:bg-purple-100/70"
				title={(interaction.config?.label as string) ?? 'Sesi çal'}
				onclick={() => (activeModal = interaction)}
			>
				<span class="text-lg leading-none">🔊</span>
			</button>
		{:else if interaction.kind === 'metin'}
			<div
				style={styleFor(interaction.rect)}
				class="overflow-auto rounded-md border border-yellow-300 bg-yellow-50/90 p-2 text-xs text-slate-700 shadow-sm"
			>
				{(interaction.config?.text as string) ?? ''}
			</div>
		{:else if interaction.kind === 'buton'}
			<button
				type="button"
				style={styleFor(interaction.rect)}
				class="flex min-h-8 items-center justify-center rounded-md border-2 border-sky-400 bg-sky-100/60 text-xs font-semibold text-sky-800 shadow-sm transition hover:bg-sky-100"
				onclick={() => handleButonClick(interaction)}
			>
				🔗 {(interaction.config?.label as string) ?? 'Bağlantı'}
			</button>
		{:else if interaction.kind === 'cevap-alani'}
			<input
				style={styleFor(interaction.rect)}
				type="text"
				value={answerValue(interaction)}
				oninput={(e) => saveAnswer(interaction, (e.currentTarget as HTMLInputElement).value)}
				class="rounded-md border-2 border-emerald-400 bg-white/95 px-2 text-sm text-slate-800 shadow-sm focus:border-emerald-600 focus:outline-none"
				placeholder="Cevabınız…"
			/>
		{:else if interaction.kind === 'harf-izgara'}
			{#each (interaction.config?.cells as string[]) ?? [] as _cell, idx (idx)}
				<input
					style={styleFor(gridCellRect(interaction, idx))}
					type="text"
					maxlength="1"
					value={((interaction.config?.cells as string[]) ?? [])[idx] ?? ''}
					oninput={(e) => setGridCell(interaction, idx, (e.currentTarget as HTMLInputElement).value)}
					class="rounded border-2 border-indigo-400 bg-white text-center text-sm font-bold text-indigo-800 shadow-sm focus:border-indigo-600 focus:outline-none"
				/>
			{/each}
		{:else if interaction.kind === 'cevap-goster'}
			<button
				type="button"
				style={styleFor(interaction.rect)}
				class="overflow-auto rounded-md border-2 border-teal-400 bg-teal-50/90 px-2 text-left text-xs text-teal-800 shadow-sm hover:bg-teal-100"
				onclick={() => toggleReveal(interaction.id)}
			>
				{#if revealedIds.has(interaction.id)}
					✅ {(interaction.config?.answer as string) ?? ''}
				{:else}
					❓ {(interaction.config?.question as string) ?? 'Cevabı göster'}
				{/if}
			</button>
		{/if}
	{/each}
</div>

{#if activeModal}
	<EtkinlikModal {documentId} interaction={activeModal} onclose={() => (activeModal = null)} />
{/if}

{#if draftRect}
	<InteractionEditForm
		{documentId}
		{pageNumber}
		rect={draftRect}
		onsave={(i) => {
			zbookStore.addInteraction(i);
			draftRect = null;
		}}
		oncancel={() => (draftRect = null)}
	/>
{/if}
