<script lang="ts">
	import { useScroll } from '@embedpdf/plugin-scroll/svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const KEY = `zbook:last-page:${documentId}`;
	const scroll = useScroll(() => documentId);

	let restored = false;

	$effect(() => {
		if (restored) return;
		const saved = localStorage.getItem(KEY);
		if (saved) {
			const pageNumber = parseInt(saved, 10);
			if (pageNumber > 1) {
				setTimeout(() => {
					scroll.provides?.scrollToPage({ pageNumber, behavior: 'auto' });
				}, 150);
			}
		}
		restored = true;
	});

	$effect(() => {
		const current = scroll.state.currentPage;
		if (current && current > 0) {
			localStorage.setItem(KEY, String(current));
		}
	});
</script>
