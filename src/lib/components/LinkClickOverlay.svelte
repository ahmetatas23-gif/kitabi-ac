<script lang="ts">
	// --- Link'e tıklayınca GÜVENİLİR şekilde açılmasını sağlayan katman ---------------------
	// EmbedPDF'in kendi "kilitli link" mekanizması (LinkLockedMode -> navigateTarget() ->
	// onNavigate event) PDF motoru (WASM worker) üzerinden ASENKRON çalışıyor. Bu yüzden
	// tıklamadan window.open() çağrısına kadar geçen sürede tarayıcı "kullanıcı jesti"
	// bağlantısını kaybedip pop-up'ı SESSİZCE engelliyor — "link kilitledim ama hâlâ
	// açılmıyor" şikayetinin kök nedeni buydu. Bu katman, URL hedefli LINK annotasyonlarının
	// üzerine kendi görünmez butonlarımızı çiziyor; tıklama olayının TAM İÇİNDE, hiçbir async
	// beklemeden doğrudan window.open() çağırıyoruz — böylece tarayıcı bunu her zaman gerçek
	// bir kullanıcı eylemi olarak kabul ediyor.
	//
	// Sadece "Görünüm Kilidi" AÇIKKEN gösterilir — kilit kapalıyken (varsayılan, düzenleme
	// modu) admin resme/nesneye normal şekilde tıklayıp seçebilsin/taşıyabilsin/silebilsin
	// diye bu katman görünmez kalır (aksi halde link her zaman tıklamaları yutar, resim bir
	// daha seçilemez hale gelirdi).
	import { useDocumentState } from '@embedpdf/core/svelte';
	import { useAnnotation } from '@embedpdf/plugin-annotation/svelte';
	import { PdfAnnotationSubtype, PdfActionType } from '@embedpdf/models';
	import type { PdfLinkAnnoObject } from '@embedpdf/models';
	import { LockModeType } from '@embedpdf/plugin-annotation';

	interface Props {
		documentId: string;
		pageIndex: number;
	}
	let { documentId, pageIndex }: Props = $props();

	const documentState = useDocumentState(() => documentId);
	const scale = $derived(documentState.current?.scale ?? 1);
	const annotation = useAnnotation(() => documentId);

	const isViewLocked = $derived(
		(annotation.state?.locked?.type ?? LockModeType.None) !== LockModeType.None
	);

	const links = $derived.by(() => {
		if (!isViewLocked) return [];
		const uids = annotation.state?.pages?.[pageIndex] ?? [];
		const out: PdfLinkAnnoObject[] = [];
		for (const uid of uids) {
			const ta = annotation.state.byUid[uid];
			const o = ta?.object;
			if (
				o &&
				o.type === PdfAnnotationSubtype.LINK &&
				o.target?.type === 'action' &&
				o.target.action?.type === PdfActionType.URI &&
				o.target.action.uri
			) {
				out.push(o as PdfLinkAnnoObject);
			}
		}
		return out;
	});

	function styleFor(rect: { origin: { x: number; y: number }; size: { width: number; height: number } }) {
		return `position:absolute; left:${rect.origin.x * scale}px; top:${rect.origin.y * scale}px; width:${
			rect.size.width * scale
		}px; height:${rect.size.height * scale}px; z-index:30; cursor:pointer; pointer-events:auto;`;
	}

	function openLink(uri: string) {
		window.open(uri, '_blank', 'noopener,noreferrer');
	}
</script>

{#each links as link (link.id)}
	{@const uri = link.target && link.target.type === 'action' && link.target.action.type === PdfActionType.URI ? link.target.action.uri : ''}
	{#if uri}
		<div
			role="link"
			tabindex="0"
			title="Bağlantıyı aç: {uri}"
			style={styleFor(link.rect)}
			onclick={() => openLink(uri)}
			onkeydown={(e) => {
				if (e.key === 'Enter') openLink(uri);
			}}
		></div>
	{/if}
{/each}
