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

	// Satır aralığı — çok satırlı bir cevabın (örn. çizgili kağıda yazılan düzeltilmiş
	// paragraf) PDF sayfasındaki arka plan çizgileriyle hizalanabilmesi için punto'dan
	// BAĞIMSIZ, ayrı ayarlanabilir olması gerekiyor. Admin bu düğmelere basarken sonucu
	// canlı olarak (PDF'in üzerinde) görüp çizgilerle tam örtüşene kadar ince ayar yapabilir.
	function setLineHeight(delta: number) {
		const next = Math.max(12, Math.min(80, (answer.lineHeight ?? 28) + delta));
		teacherStore.update(answer.id, { lineHeight: next });
	}

	let linkDraft = $state(answer.linkUrl ?? '');
	function saveLink() {
		teacherStore.update(answer.id, { linkUrl: linkDraft.trim() || undefined });
	}

	let editingText = $state(false);
	let textDraft = $state(answer.text ?? '');
	function saveText() {
		teacherStore.update(answer.id, { text: textDraft });
		editingText = false;
	}
</script>

<div
	style={style + 'pointer-events:auto;'}
	class="z-[400] w-max max-w-xs rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl"
>
	<div class="flex flex-wrap items-center gap-1">
		{#if answer.kind === 'gizli-metin' || answer.kind === 'metin'}
			<button
				type="button"
				onclick={() => setFontSize(-2)}
				class="flex h-7 w-7 items-center justify-center rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
				title="Punto küçült">A-</button
			>
			<span class="w-6 text-center text-[10px] text-slate-400">{answer.fontSize ?? 20}</span>
			<button
				type="button"
				onclick={() => setFontSize(2)}
				class="flex h-7 w-7 items-center justify-center rounded text-sm font-bold text-slate-600 hover:bg-slate-100"
				title="Punto büyüt">A+</button
			>
			<div class="mx-1 h-5 w-px bg-slate-200"></div>
			<button
				type="button"
				onclick={() => setLineHeight(-2)}
				class="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
				title="Satır aralığını daralt (çizgiye yaklaştır)">≡-</button
			>
			<span class="w-6 text-center text-[10px] text-slate-400">{answer.lineHeight ?? 28}</span>
			<button
				type="button"
				onclick={() => setLineHeight(2)}
				class="flex h-7 w-7 items-center justify-center rounded text-xs font-bold text-slate-600 hover:bg-slate-100"
				title="Satır aralığını genişlet (çizgiye uzaklaştır)">≡+</button
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
			<button
				type="button"
				onclick={() => {
					textDraft = answer.text ?? '';
					editingText = !editingText;
				}}
				class="flex h-7 w-7 items-center justify-center rounded text-sm text-slate-600 hover:bg-slate-100"
				title="Metni düzenle">✏️</button
			>
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
	{#if editingText}
		<div class="mt-1.5 border-t border-slate-100 pt-1.5">
			<textarea
				bind:value={textDraft}
				rows="4"
				class="w-56 rounded border border-slate-300 px-2 py-1 text-xs"
				placeholder="Enter ile satır sonu — her satırı çizgili sayfadaki ilgili çizgiye denk gelecek şekilde böl"
			></textarea>
			<div class="mt-1 flex justify-end gap-1">
				<button
					type="button"
					onclick={() => (editingText = false)}
					class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100">İptal</button
				>
				<button
					type="button"
					onclick={saveText}
					class="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700"
					>Kaydet</button
				>
			</div>
		</div>
	{/if}
</div>
