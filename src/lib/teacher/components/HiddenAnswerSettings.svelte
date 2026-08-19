<script lang="ts">
	import type { HiddenAnswer } from '../types';
	import { teacherStore } from '../store.svelte';

	interface Props {
		answer: HiddenAnswer;
		style: string; // konumlandırma (item'ın hemen üstünde/yanında)
		onclose: () => void;
	}
	let { answer, style, onclose }: Props = $props();

	const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#ea580c'];

	function setFontSize(delta: number) {
		const next = Math.max(10, Math.min(48, (answer.fontSize ?? 20) + delta));
		teacherStore.update(answer.id, { fontSize: next });
	}

	let linkDraft = $state(answer.linkUrl ?? '');
	function saveLink() {
		teacherStore.update(answer.id, { linkUrl: linkDraft.trim() || undefined });
	}
</script>

<div
	style={style + 'pointer-events:auto;'}
	class="z-[400] flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl"
>
	{#if answer.kind === 'gizli-metin' || answer.kind === 'metin'}
		<button
			type="button"
			onclick={() => setFontSize(-2)}
			class="flex h-7 w-7 items-center justify-center rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
			title="Küçült">A-</button
		>
		<span class="w-6 text-center text-[10px] text-slate-400">{answer.fontSize ?? 20}</span>
		<button
			type="button"
			onclick={() => setFontSize(2)}
			class="flex h-7 w-7 items-center justify-center rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
			title="Büyüt">A+</button
		>
		<div class="mx-1 h-5 w-px bg-slate-200"></div>
		{#each COLORS as c (c)}
			<button
				type="button"
				onclick={() => teacherStore.update(answer.id, { color: c })}
				class="h-5 w-5 rounded-full border-2 {answer.color === c
					? 'border-slate-800'
					: 'border-transparent'}"
				style="background:{c};"
				title={c}
			></button>
		{/each}
		<div class="mx-1 h-5 w-px bg-slate-200"></div>
	{:else if answer.kind === 'gorsel'}
		<input
			bind:value={linkDraft}
			placeholder="https://... (link, boş bırakılabilir)"
			class="h-7 w-40 rounded border border-slate-300 px-2 text-xs"
		/>
		<button
			type="button"
			onclick={saveLink}
			class="flex h-7 items-center rounded bg-blue-600 px-2 text-xs font-semibold text-white hover:bg-blue-700"
			title="Linki kaydet">Kaydet</button
		>
		<div class="mx-1 h-5 w-px bg-slate-200"></div>
	{/if}
	<button
		type="button"
		onclick={() => {
			teacherStore.remove(answer.id);
			onclose();
		}}
		class="flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-50"
		title="Sil"
	>
		🗑️
	</button>
	<button
		type="button"
		onclick={onclose}
		class="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-slate-100"
		title="Kapat"
	>
		✕
	</button>
</div>
