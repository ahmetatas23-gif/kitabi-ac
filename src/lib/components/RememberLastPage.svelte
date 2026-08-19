<script lang="ts">
	import { useScroll } from '@embedpdf/plugin-scroll/svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const KEY = `zbook:last-page:${documentId}`;
	const scroll = useScroll(() => documentId);

	let restored = false;

	// ÖNEMLİ (2. tur düzeltme): `scroll.state.totalPages` varsayılan olarak 1'den
	// başlıyor (embedpdf'in kendi useScroll hook'unun İLK DEĞERİ — kitap gerçekte
	// kaç sayfa olursa olsun, plugin/döküman henüz tam ayrışmadıysa 1 dönüyor).
	// Önceki sürümde "provides && total>0" yeterli sanılmıştı ama total=1 de
	// bu koşulu sağladığı için scrollToPage(Math.min(pageNumber,1))=1 çağrılıyor,
	// yani PRATİKTE HİÇBİR ŞEY YAPMIYOR (zaten 1. sayfadayız) ve fonksiyon bir
	// daha denemeden çıkıyordu — kaydedilen gerçek sayfaya HİÇBİR ZAMAN atlanmıyordu.
	// Şimdi ya total kaydedilen sayfaya YETECEK KADAR büyümüş olmalı (total>=pageNumber,
	// gerçek sayı öğrenilmiş demektir) YA DA total art arda birkaç yoklamada
	// DEĞİŞMEDEN aynı kalmış olmalı (kitabın gerçek sayfa sayısı bu ve pageNumber
	// ondan büyükse — örn. eski bir kayıt/başka kitap — yine de elimizdeki en iyi
	// değere göre atlarız).
	$effect(() => {
		if (restored) return;
		restored = true; // bu effect'in tekrar tetiklenmesini önle — asıl deneme aşağıdaki closure'da
		const saved = localStorage.getItem(KEY);
		if (!saved) return;
		const pageNumber = parseInt(saved, 10);
		if (!(pageNumber > 1)) return;
		let attempts = 0;
		const maxAttempts = 25;
		let lastTotal = -1;
		let stableCount = 0;
		const tryRestore = () => {
			attempts++;
			const provides = scroll.provides;
			const total = scroll.state.totalPages;
			if (provides && total) {
				if (total === lastTotal) stableCount++;
				else {
					stableCount = 0;
					lastTotal = total;
				}
				const confident = total >= pageNumber || (stableCount >= 2 && total > 1);
				if (confident) {
					provides.scrollToPage({ pageNumber: Math.min(pageNumber, total), behavior: 'auto' });
					return;
				}
			}
			if (attempts < maxAttempts) {
				setTimeout(tryRestore, 300);
			}
			// maxAttempts'e ulaşıldıysa sessizce vazgeçilir — kitap normal (1. sayfa) açılır.
		};
		setTimeout(tryRestore, 150);
	});

	$effect(() => {
		const current = scroll.state.currentPage;
		if (current && current > 0) {
			localStorage.setItem(KEY, String(current));
		}
	});
</script>
