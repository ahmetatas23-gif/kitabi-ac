<script lang="ts">
	import { useScroll } from '@embedpdf/plugin-scroll/svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const KEY = `zbook:last-page:${documentId}`;
	const scroll = useScroll(() => documentId);

	let restored = false;

	// ÖNEMLİ: Tek seferlik sabit bir gecikme (150ms) yetersizdi — özellikle büyük (50MB+)
	// kitaplarda sayfa/viewport ölçümleri o kadar sürede hazır olmayabiliyor, bu durumda
	// scrollToPage sessizce hiçbir şey yapmıyordu ve bir daha da denenmiyordu (restored=true
	// zaten set edilmişti). Artık scroll altyapısı GERÇEKTEN hazır olana kadar (totalPages>0)
	// birkaç kez, artan aralıklarla tekrar deniyoruz; en fazla ~6 saniye boyunca.
	$effect(() => {
		if (restored) return;
		restored = true; // bu effect'in tekrar tetiklenmesini önle — asıl deneme aşağıdaki closure'da
		const saved = localStorage.getItem(KEY);
		if (!saved) return;
		const pageNumber = parseInt(saved, 10);
		if (!(pageNumber > 1)) return;
		let attempts = 0;
		const maxAttempts = 20;
		const tryRestore = () => {
			attempts++;
			const provides = scroll.provides;
			const total = scroll.state.totalPages;
			if (provides && total && total > 0) {
				provides.scrollToPage({ pageNumber: Math.min(pageNumber, total), behavior: 'auto' });
				return;
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
