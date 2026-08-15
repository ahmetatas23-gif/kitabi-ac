<script lang="ts">
	import { useZoom, ZoomMode } from '@embedpdf/plugin-zoom/svelte';
	import { clickOutside } from '$lib/actions/click-outside';

	interface Props {
		documentId: string;
		docked: boolean;
	}
	let { documentId, docked }: Props = $props();

	const zoom = useZoom(() => documentId);
	const percent = $derived(Math.round((zoom.state?.currentZoomLevel ?? 1) * 100));

	const PRESETS = [25, 50, 100, 125, 150, 200, 400, 800];

	let open = $state(false);
	function pick(p: number) {
		zoom.provides?.requestZoom(p / 100);
		open = false;
	}
	function fitPage() {
		zoom.provides?.requestZoom(ZoomMode.FitPage);
		open = false;
	}
	function fitWidth() {
		zoom.provides?.requestZoom(ZoomMode.FitWidth);
		open = false;
	}
	function toggleMarquee() {
		zoom.provides?.toggleMarqueeZoom();
		open = false;
	}
</script>

<div class="relative" use:clickOutside={() => (open = false)}>
	<button
		type="button"
		title="Yakınlaştırma menüsü"
		onclick={() => (open = !open)}
		class="flex h-9 items-center justify-center gap-1 rounded px-2 text-xs font-semibold transition-colors {zoom
			.state?.isMarqueeZoomActive
			? 'bg-blue-500 text-white'
			: docked
				? 'text-slate-200 hover:bg-slate-700'
				: 'text-slate-700 hover:bg-slate-100'}"
	>
		🔍 {percent}% ▼
	</button>

	{#if open}
		<div
			class="absolute left-full top-0 z-[510] ml-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-2xl"
		>
			{#each PRESETS as p (p)}
				<button
					type="button"
					onclick={() => pick(p)}
					class="flex w-full items-center justify-between rounded px-3 py-2 text-sm hover:bg-slate-100 {percent ===
					p
						? 'font-bold text-blue-600'
						: 'text-slate-700'}"
				>
					{p}%
					{#if percent === p}✓{/if}
				</button>
			{/each}

			<div class="my-1 h-px bg-slate-200"></div>

			<button
				type="button"
				onclick={fitPage}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
			>
				📄 Sayfaya Sığdır
			</button>
			<button
				type="button"
				onclick={fitWidth}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
			>
				↔️ Genişliğe Sığdır
			</button>

			<div class="my-1 h-px bg-slate-200"></div>

			<button
				type="button"
				onclick={toggleMarquee}
				class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium {zoom.state
					?.isMarqueeZoomActive
					? 'bg-blue-50 text-blue-600'
					: 'text-slate-700 hover:bg-slate-100'}"
			>
				🔎 Alanı Büyüt {zoom.state?.isMarqueeZoomActive ? '(aktif)' : ''}
			</button>
		</div>
	{/if}
</div>
