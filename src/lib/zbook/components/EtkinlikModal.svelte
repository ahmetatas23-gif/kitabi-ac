<script lang="ts">
	import { useRenderCapability } from '@embedpdf/plugin-render/svelte';
	import { PdfErrorCode } from '@embedpdf/models';
	import { zbookStore } from '../store.svelte';
	import type { ZBookInteraction } from '../types';

	interface Props {
		documentId: string;
		interaction: ZBookInteraction;
		onclose: () => void;
	}

	let { documentId, interaction, onclose }: Props = $props();

	const renderCapability = useRenderCapability();
	let imageUrl = $state<string | null>(null);
	let isLoading = $state(true);
	let renderErr = $state<string | null>(null);

	// AŞAMA 8: Mercek için sayfanın SADECE ilgili bölgesini, yüksek çözünürlükte
	// (scaleFactor: 4) render ediyoruz — yer tutucu değil, gerçek kırpılmış görüntü.
	$effect(() => {
		const capability = renderCapability.provides;
		if (!capability || interaction.kind !== 'mercek') {
			isLoading = false;
			return;
		}
		isLoading = true;
		renderErr = null;
		const scoped = capability.forDocument(documentId);
		// ÖNEMLİ: interaction.rect, zbookStore'un $state (reaktif/Proxy) dizisinden
		// geliyor. Proxy nesneleri Worker'a postMessage ile gönderilemez
		// ("could not be cloned" hatası) — bu yüzden düz bir kopya çıkarıyoruz.
		const plainRect = {
			origin: { x: interaction.rect.origin.x, y: interaction.rect.origin.y },
			size: { width: interaction.rect.size.width, height: interaction.rect.size.height }
		};
		const task = scoped.renderPageRect({
			pageIndex: interaction.pageNumber - 1,
			rect: plainRect,
			options: { scaleFactor: 4, dpr: window.devicePixelRatio || 1 }
		});

		let url: string | null = null;
		task.wait(
			(blob) => {
				url = URL.createObjectURL(blob);
				imageUrl = url;
				isLoading = false;
			},
			(err) => {
				renderErr = err?.reason?.message ?? 'Görüntü oluşturulamadı';
				isLoading = false;
			}
		);

		return () => {
			if (url) URL.revokeObjectURL(url);
			else task.abort({ code: PdfErrorCode.Cancelled, message: 'canceled zbook crop render' });
		};
	});

	// AŞAMA 14: etkinlik bir haftaya bağlıysa, ders-plani'den gelen gerçek
	// süreç bileşeni / kazanım metnini burada gösteriyoruz.
	const weekRow = $derived(interaction.haftaNo ? zbookStore.weekRow(interaction.haftaNo) : undefined);
	const label = $derived((interaction.config?.label as string) ?? 'Etkinlik');
</script>

<div
	class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-3 md:p-8"
	role="dialog"
	aria-modal="true"
	onclick={onclose}
>
	<div
		class="flex h-[92vh] w-[95vw] max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
		onclick={(e) => e.stopPropagation()}
	>
		<div class="flex items-center justify-between border-b border-slate-200 px-5 py-3">
			<h2 class="text-base font-bold text-slate-800">
				{interaction.kind === 'mercek' ? '🔍' : interaction.kind === 'video' ? '🎬' : '🔊'}
				{label}
			</h2>
			<button
				onclick={onclose}
				class="rounded-full px-2 py-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
				aria-label="Kapat">✕</button
			>
		</div>

		<div class="flex-1 overflow-auto p-5">
			{#if weekRow}
				<div class="mb-4 rounded-lg bg-blue-50 p-3">
					<p class="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">
						Hafta {weekRow.hafta_no} — {weekRow.tema}
					</p>
					{#if weekRow.kazanim}
						<p class="whitespace-pre-line text-sm text-slate-700">{weekRow.kazanim}</p>
					{/if}
				</div>
			{/if}

			{#if interaction.kind === 'mercek'}
				{#if isLoading}
					<div class="flex h-64 items-center justify-center text-sm text-slate-400">
						Büyütülüyor…
					</div>
				{:else if renderErr}
					<p class="rounded bg-red-50 p-3 text-sm text-red-700">Hata: {renderErr}</p>
				{:else if imageUrl}
					<img src={imageUrl} alt={label} class="mx-auto max-h-full max-w-full rounded-lg shadow-lg" />
				{/if}
			{:else if interaction.kind === 'video'}
				{#if interaction.config?.src}
					<video
						src={interaction.config.src as string}
						controls
						class="mx-auto max-w-full rounded-lg"
					></video>
				{:else}
					<p class="text-sm text-slate-400">Video kaynağı (config.src) tanımlı değil.</p>
				{/if}
			{:else if interaction.kind === 'audio'}
				{#if interaction.config?.src}
					<audio src={interaction.config.src as string} controls class="w-full"></audio>
				{:else}
					<p class="text-sm text-slate-400">Ses kaynağı (config.src) tanımlı değil.</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
