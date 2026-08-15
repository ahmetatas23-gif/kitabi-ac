<script lang="ts">
	import { useDocumentState } from '@embedpdf/core/svelte';
	import { zbookStore } from '../store.svelte';
	import { toExternalFormat, fromExternalFormat, type ExternalInteractionJson } from '../format';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const documentState = useDocumentState(() => documentId);

	function pageSize(pageNumber: number) {
		const page = documentState.current?.document?.pages[pageNumber - 1];
		return page?.size ?? { width: 612, height: 792 }; // A4/Letter varsayılan yedek
	}

	// Kitabın hazırlanmış (editör tarafından oluşturulmuş) etkileşim JSON'unu
	// yükler — oransal (0-1) koordinat formatında (bkz. format.ts).
	$effect(() => {
		if (!documentState.current?.document) return; // sayfa boyutları hazır olmalı
		(async () => {
			try {
				const res = await fetch(`/books/${documentId}/interactions.json`);
				if (!res.ok) return;
				const data = (await res.json()) as ExternalInteractionJson[];
				const existingIds = new Set(zbookStore.interactionsForBook(documentId).map((i) => i.id));
				for (const json of data) {
					const interaction = fromExternalFormat(json, pageSize(json.page));
					interaction.bookId = documentId;
					if (!existingIds.has(interaction.id)) zbookStore.addInteraction(interaction);
				}
			} catch {
				// Dosya yok veya bozuk — sessizce geç, editör modunda sıfırdan oluşturulabilir.
			}
		})();
	});

	function exportJson() {
		const data = zbookStore
			.interactionsForBook(documentId)
			.map((i) => toExternalFormat(i, pageSize(i.pageNumber)));
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${documentId}-interactions.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

{#if zbookStore.editMode}
	<div class="pointer-events-auto fixed right-4 top-16 z-[150]">
		<button
			onclick={exportJson}
			class="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-slate-700"
		>
			⬇ Bu kitabın etkileşimlerini JSON'a aktar ({zbookStore.interactionsForBook(documentId)
				.length})
		</button>
	</div>
{/if}
