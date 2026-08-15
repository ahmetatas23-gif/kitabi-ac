<script lang="ts">
	import { curtainStore, closeCurtain } from '../store.svelte';

	let dragging = $state(false);
	let dragOffset = { x: 0, y: 0 };
	function startMove(e: PointerEvent) {
		dragging = true;
		dragOffset = { x: e.clientX - curtainStore.rect.x, y: e.clientY - curtainStore.rect.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onMove(e: PointerEvent) {
		if (!dragging) return;
		curtainStore.rect = {
			...curtainStore.rect,
			x: e.clientX - dragOffset.x,
			y: e.clientY - dragOffset.y
		};
	}
	function endMove() {
		dragging = false;
	}

	let resizing = $state(false);
	let resizeStart = { x: 0, y: 0, w: 0, h: 0 };
	function startResize(e: PointerEvent) {
		e.stopPropagation();
		resizing = true;
		resizeStart = { x: e.clientX, y: e.clientY, w: curtainStore.rect.w, h: curtainStore.rect.h };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onResize(e: PointerEvent) {
		if (!resizing) return;
		const dw = e.clientX - resizeStart.x;
		const dh = e.clientY - resizeStart.y;
		curtainStore.rect = {
			...curtainStore.rect,
			w: Math.max(80, resizeStart.w + dw),
			h: Math.max(60, resizeStart.h + dh)
		};
	}
	function endResize() {
		resizing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && curtainStore.active) closeCurtain();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if curtainStore.active}
	<div
		style="position:fixed; left:{curtainStore.rect.x}px; top:{curtainStore.rect.y}px; width:{curtainStore
			.rect.w}px; height:{curtainStore.rect.h}px; box-shadow: 0 0 0 9999px rgba(0,0,0,0.78); z-index:450; border:2px solid rgba(255,255,255,0.6); border-radius:4px; pointer-events:none;"
	></div>

	<div
		style="position:fixed; left:{curtainStore.rect.x}px; top:{curtainStore.rect.y - 40}px; width:{curtainStore
			.rect.w}px; height:36px; z-index:451;"
		class="flex items-center justify-center gap-2 rounded-t-md bg-slate-800/90"
		onpointerdown={startMove}
		onpointermove={onMove}
		onpointerup={endMove}
		role="button"
		tabindex="0"
	>
		<span class="cursor-move text-lg text-white">⠿</span>
		<span class="text-xs font-semibold text-white">Sürükle</span>
		<button
			type="button"
			onpointerdown={(e) => e.stopPropagation()}
			onclick={closeCurtain}
			class="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm text-white hover:bg-white/30"
			title="Perdeyi kapat (ESC)"
		>
			✕
		</button>
	</div>

	<div
		style="position:fixed; left:{curtainStore.rect.x + curtainStore.rect.w - 24}px; top:{curtainStore
			.rect.y +
			curtainStore.rect.h -
			24}px; width:48px; height:48px; z-index:452;"
		class="flex cursor-nwse-resize items-center justify-center rounded-full bg-slate-800/90 text-white shadow-lg"
		onpointerdown={startResize}
		onpointermove={onResize}
		onpointerup={endResize}
		role="button"
		tabindex="0"
		title="Boyutlandır"
	>
		⤡
	</div>
{/if}
