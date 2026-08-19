<script lang="ts">
	import { useScroll } from '@embedpdf/plugin-scroll/svelte';
	import { useDocumentState } from '@embedpdf/core/svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const KEY = `zbook:last-page:${documentId}`;
	const scroll = useScroll(() => documentId);
	const documentState = useDocumentState(() => documentId);

	// ÖNEMLİ (3. tur düzeltme — GERÇEK KÖK NEDEN BULUNDU): Bu bileşende İKİ ayrı
	// $effect var: biri kaydedilmiş sayfayı GERİ YÜKLER, diğeri şu anki sayfayı
	// SÜREKLİ KAYDEDER. Asıl hata şuydu: "kaydet" effect'i, embedpdf'in scroll
	// state'i henüz gerçek sayfayı bilmeden ÖNCE (varsayılan currentPage=1 ile)
	// bileşen mount olur olmaz hemen çalışıyor ve localStorage'daki GERÇEK kaydı
	// (örn. "45") "1" ile EZİYORDU — bu da "geri yükle" effect'i belge yüklenip
	// asıl scrollToPage çağrısını yapmadan ÖNCE, senkron olarak oluyordu (aynı
	// component ilk render turunda, sadece birkaç satır sonra). Sonuç: kaydedilen
	// sayfa numarası her açılışta sessizce 1'e sıfırlanıyordu — "geri yükle" kodu
	// hep DOĞRU çalışıyordu ama geri yükleyecek doğru bir değer kalmıyordu.
	//
	// Çözüm iki parçalı:
	//  (a) Kaydedilmiş değeri bileşen ilk oluşturulurken BİR KEZ, senkron olarak
	//      oku ve `initialPageNumber`'da sakla — restore mantığı SONRAKİ effect
	//      çalıştırmalarında bunu tekrar localStorage'dan OKUMAZ, ilk yakaladığı
	//      değeri kullanır; böylece arada "kaydet" effect'inin yazdığı "1" bu
	//      değeri bozamaz.
	//  (b) "kaydet" effect'i, biz geri yükleme denemesini bitirene (başarılı ya da
	//      pes ederek) kadar HİÇBİR ŞEY YAZMASIN (`readyToSave` bayrağı).
	const initialSaved = localStorage.getItem(KEY);
	const initialPageNumber = initialSaved ? parseInt(initialSaved, 10) : NaN;

	let restoreAttempted = false;
	let readyToSave = $state(false);

	$effect(() => {
		if (restoreAttempted) return;
		// status: 'loading' | 'loaded' | 'error' — embedpdf çekirdek store'undan gelen
		// GERÇEK belge durumu (scroll eklentisinin totalPages tahmininden daha
		// güvenilir; totalPages varsayılan olarak 1'den başlıyor ve yanlış pozitif
		// veriyordu — önceki iki düzeltme denemesinin neden yetersiz kaldığı buydu).
		const status = documentState.current?.status;
		if (status !== 'loaded') return;
		restoreAttempted = true;
		if (!(initialPageNumber > 1)) {
			readyToSave = true; // geri yüklenecek bir şey yok, kayda hemen izin ver
			return;
		}
		let attempts = 0;
		const maxAttempts = 15;
		const tryRestore = () => {
			attempts++;
			const provides = scroll.provides;
			const total = scroll.state.totalPages;
			if (provides && total >= initialPageNumber) {
				provides.scrollToPage({ pageNumber: Math.min(initialPageNumber, total), behavior: 'auto' });
				readyToSave = true;
				return;
			}
			if (attempts >= maxAttempts) {
				// Son çare: elimizdeki en iyi tahminle (belki hafif eksik total) yine de dene.
				if (provides && total > 0) {
					provides.scrollToPage({ pageNumber: Math.min(initialPageNumber, total), behavior: 'auto' });
				}
				readyToSave = true;
				return;
			}
			setTimeout(tryRestore, 200);
		};
		setTimeout(tryRestore, 100);
	});

	$effect(() => {
		const current = scroll.state.currentPage;
		if (!readyToSave) return; // geri yükleme denemesi bitmeden ASLA yazma (yarış durumunu önler)
		if (current && current > 0) {
			localStorage.setItem(KEY, String(current));
		}
	});
</script>
