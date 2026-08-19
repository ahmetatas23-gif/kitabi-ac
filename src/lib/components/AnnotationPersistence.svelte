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

	// --- ArrayBuffer <-> base64 dönüşümü -------------------------------------------------
	// "insert:add-image" (📷) ile eklenen görseller STAMP annotasyonu olarak, gerçek görsel
	// baytlarını `ctx.data` alanında bir ArrayBuffer olarak taşır (bkz. EmbedPDF tipi:
	// AnnotationTransferItem — "For stamps, ctx carries the binary data needed for
	// round-tripping"). JSON.stringify bir ArrayBuffer'ı SESSİZCE `{}`'e çeviriyor — yani
	// görsel baytları kayboluyor, sayfa yenilenince görsel "kayboluyormuş" gibi görünüyordu.
	// Kaydetmeden önce ArrayBuffer'ı base64 metne çeviriyoruz, yüklerken geri ArrayBuffer'a
	// çeviriyoruz — böylece gerçek görsel verisi localStorage'da güvenle saklanıyor.
	function arrayBufferToBase64(buf: ArrayBuffer): string {
		let binary = '';
		const bytes = new Uint8Array(buf);
		const chunkSize = 0x8000;
		for (let i = 0; i < bytes.length; i += chunkSize) {
			binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
		}
		return btoa(binary);
	}
	function base64ToArrayBuffer(b64: string): ArrayBuffer {
		const binary = atob(b64);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
		return bytes.buffer;
	}
	// Kaydetmeden önce: gerçek ArrayBuffer'ları JSON-güvenli base64 sarmalayıcıya çevirir.
	function prepareForStorage(items: unknown): unknown {
		return (items as Array<{ ctx?: { data?: unknown } }>).map((item) => {
			const data = item?.ctx?.data;
			if (data instanceof ArrayBuffer) {
				return { ...item, ctx: { ...item.ctx, data: { __b64: arrayBufferToBase64(data) } } };
			}
			return item;
		});
	}
	// Yüklerken: base64 sarmalayıcıyı gerçek ArrayBuffer'a geri çevirir.
	function restoreFromStorage(items: unknown): unknown {
		return (items as Array<{ ctx?: { data?: unknown } }>).map((item) => {
			const data = item?.ctx?.data as { __b64?: string } | undefined;
			if (data && typeof data === 'object' && typeof data.__b64 === 'string') {
				return { ...item, ctx: { ...item.ctx, data: base64ToArrayBuffer(data.__b64) } };
			}
			return item;
		});
	}

	$effect(() => {
		if (loaded || !annotation.provides) return;
		try {
			const raw = localStorage.getItem(KEY);
			if (raw) {
				const items = restoreFromStorage(JSON.parse(raw));
				annotation.provides.importAnnotations(
					items as Parameters<typeof annotation.provides.importAnnotations>[0]
				);
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
						localStorage.setItem(KEY, JSON.stringify(prepareForStorage(items)));
					} catch {
						// localStorage dolu/erişilemez — sessizce geç.
					}
				},
				() => {}
			);
		}, 800);
	});
</script>
