<script lang="ts">
	import type { HiddenAnswer, HiddenAnswerKind } from '../types';
	import type { Rect } from '@embedpdf/models';
	import { portal } from '$lib/actions/portal';

	interface Props {
		bookId: string;
		pageNumber: number;
		rect: Rect;
		popupStyle: string; // çizilen yerin yakınına konumlandırma
		onsave: (a: HiddenAnswer) => void;
		oncancel: () => void;
	}
	let { bookId, pageNumber, rect, popupStyle, onsave, oncancel }: Props = $props();

	let kind = $state<HiddenAnswerKind>('gizli-metin');
	let text = $state('');

	function save() {
		onsave({
			id: crypto.randomUUID(),
			bookId,
			pageNumber,
			kind,
			rect,
			text: kind === 'gizli-metin' ? text : undefined,
			fontSize: 20,
			color: '#111827',
			hidden: true,
			createdAt: new Date().toISOString()
		});
	}
</script>

<div use:portal>
	<!-- Arka planı hafif karart (tıklayınca iptal), ama popup çizilen yerin YANINDA -->
	<div class="fixed inset-0 z-[299] bg-black/10" role="presentation" onclick={oncancel}></div>

	<div
		style={popupStyle + 'z-index:300;'}
		class="w-64 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl"
	>
		<h3 class="mb-3 text-sm font-bold text-slate-800">🔒 Gizli Cevap Ekle</h3>

		<div class="mb-3 grid grid-cols-2 gap-2">
			<button
				type="button"
				onclick={() => (kind = 'gizli-metin')}
				class="rounded-md border-2 p-2 text-xs font-medium {kind === 'gizli-metin'
					? 'border-blue-500 bg-blue-50'
					: 'border-slate-200'}"
			>
				📝 Gizli Metin
			</button>
			<button
				type="button"
				onclick={() => (kind = 'gizli-alan')}
				class="rounded-md border-2 p-2 text-xs font-medium {kind === 'gizli-alan'
					? 'border-blue-500 bg-blue-50'
					: 'border-slate-200'}"
			>
				🟨 Gizli Alan
			</button>
		</div>

		{#if kind === 'gizli-metin'}
			<label class="mb-3 block text-xs font-semibold text-slate-600">
				Cevap metni
				<input
					bind:value={text}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					placeholder="Örn. 472"
				/>
			</label>
		{:else}
			<p class="mb-3 text-xs text-slate-500">
				Seçtiğin alan, gizliyken opak bir kapakla örtülecek.
			</p>
		{/if}

		<div class="flex justify-end gap-2">
			<button onclick={oncancel} class="rounded px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
				>İptal</button
			>
			<button
				onclick={save}
				class="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
				>Ekle (gizli olarak)</button
			>
		</div>
	</div>
</div>
