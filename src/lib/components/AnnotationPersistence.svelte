<script lang="ts">
	import { useAnnotation } from '@embedpdf/plugin-annotation/svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const KEY = `zbook:annotations:${documentId}`;
	const annotation = useAnnotation(() => documentId);

	let loaded = false;
	let saveTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (loaded || !annotation.provides) return;
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) {
				const items = JSON.parse(raw);
				annotation.provides.importAnnotations(items);
			}
		} catch {
			// Bozuk/eski veri — sessizce geç, boş başla.
		}
		loaded = true;
	});

	$effect(() => {
		const _trigger = annotation.state.byUid;
		if (!loaded || !annotation.provides) return;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			annotation.provides?.exportAnnotations().wait(
				(items) => {
					try {
						localStorage.setItem(KEY, JSON.stringify(items));
					} catch {
						// localStorage dolu/erişilemez — sessizce geç.
					}
				},
				() => {}
			);
		}, 800);
	});
</script>
