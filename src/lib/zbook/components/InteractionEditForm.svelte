<script lang="ts">
	import type { InteractionKind, ZBookInteraction } from '../types';
	import type { Rect } from '@embedpdf/models';

	interface Props {
		documentId: string;
		pageNumber: number;
		rect: Rect;
		onsave: (interaction: ZBookInteraction) => void;
		oncancel: () => void;
	}

	let { documentId, pageNumber, rect, onsave, oncancel }: Props = $props();

	let kind = $state<InteractionKind>('mercek');
	let label = $state('');
	let text = $state('');
	let href = $state('');
	let question = $state('');
	let answer = $state('');
	let gridLength = $state(5);

	const kindOptions: { value: InteractionKind; icon: string; title: string }[] = [
		{ value: 'mercek', icon: '🔍', title: 'Mercek' },
		{ value: 'cevap-alani', icon: '📝', title: 'Cevap Alanı' },
		{ value: 'metin', icon: '💬', title: 'Not' },
		{ value: 'buton', icon: '🔗', title: 'Buton' },
		{ value: 'video', icon: '🎬', title: 'Video' },
		{ value: 'audio', icon: '🔊', title: 'Ses' },
		{ value: 'harf-izgara', icon: '🔤', title: 'Harf Izgarası' },
		{ value: 'cevap-goster', icon: '❓', title: 'Cevabı Göster' }
	];

	function handleSave() {
		const config: Record<string, unknown> = {};
		if (label) config.label = label;
		if (kind === 'metin') config.text = text;
		if (kind === 'buton' && href) config.href = href;
		if (kind === 'video' || kind === 'audio') config.src = href;
		if (kind === 'cevap-goster') {
			config.question = question;
			config.answer = answer;
		}
		if (kind === 'harf-izgara') {
			config.cells = Array.from({ length: gridLength }, () => '');
		}

		onsave({
			id: crypto.randomUUID(),
			bookId: documentId,
			pageNumber,
			kind,
			rect,
			config
		});
	}
</script>

<div
	class="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4"
	role="dialog"
	aria-modal="true"
>
	<div class="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl">
		<h3 class="mb-3 text-sm font-bold text-slate-800">Yeni Etkileşim</h3>

		<div class="mb-4 grid grid-cols-4 gap-2">
			{#each kindOptions as opt (opt.value)}
				<button
					type="button"
					onclick={() => (kind = opt.value)}
					class="flex flex-col items-center rounded-md border-2 p-2 text-xs {kind === opt.value
						? 'border-blue-500 bg-blue-50'
						: 'border-slate-200 hover:border-slate-300'}"
				>
					<span class="text-lg">{opt.icon}</span>
					{opt.title}
				</button>
			{/each}
		</div>

		{#if kind !== 'harf-izgara' && kind !== 'cevap-goster'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Etiket
				<input
					bind:value={label}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					placeholder="Örn. Etkinlik 1"
				/>
			</label>
		{/if}

		{#if kind === 'metin'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Metin
				<textarea
					bind:value={text}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					rows="2"
				></textarea>
			</label>
		{/if}

		{#if kind === 'buton'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Bağlantı (URL)
				<input
					bind:value={href}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					placeholder="https://…"
				/>
			</label>
		{/if}

		{#if kind === 'video' || kind === 'audio'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Medya kaynağı (URL)
				<input
					bind:value={href}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					placeholder="/media/…"
				/>
			</label>
		{/if}

		{#if kind === 'cevap-goster'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Soru (opsiyonel)
				<input
					bind:value={question}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
				/>
			</label>
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Cevap
				<input
					bind:value={answer}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
				/>
			</label>
		{/if}

		{#if kind === 'harf-izgara'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Kutu sayısı
				<input
					type="number"
					min="1"
					max="30"
					bind:value={gridLength}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
				/>
			</label>
			<p class="mb-2 text-xs text-slate-400">
				Harfler eklendikten sonra kutulara tıklayarak tek tek doldurabilirsin.
			</p>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			<button
				onclick={oncancel}
				class="rounded px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100">İptal</button
			>
			<button
				onclick={handleSave}
				class="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
				>Ekle</button
			>
		</div>
	</div>
</div>
