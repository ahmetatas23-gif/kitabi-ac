<script lang="ts">
	import { useScroll } from '@embedpdf/plugin-scroll/svelte';
	import { teacherStore } from '../store.svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const scroll = useScroll(() => documentId);
	const currentPage = $derived(scroll.state.currentPage);

	const pageAnswers = $derived(teacherStore.forPage(documentId, currentPage));
	const hiddenCount = $derived(pageAnswers.filter((a) => a.hidden).length);
	const shownCount = $derived(pageAnswers.length - hiddenCount);
</script>

{#if teacherStore.teacherMode && pageAnswers.length > 0}
	<div
		class="fixed bottom-4 right-4 z-[150] flex items-center gap-2 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 shadow-xl backdrop-blur"
	>
		<span class="text-xs font-semibold text-slate-500">
			Bu sayfada {pageAnswers.length} gizli cevap ({shownCount} açık)
		</span>
		<button
			type="button"
			onclick={() => teacherStore.showAllOnPage(documentId, currentPage)}
			class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
		>
			👁 Tümünü Göster
		</button>
		<button
			type="button"
			onclick={() => teacherStore.hideAllOnPage(documentId, currentPage)}
			class="rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800"
		>
			🙈 Tümünü Gizle
		</button>
	</div>
{/if}
