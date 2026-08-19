<script lang="ts">
	import type { HiddenAnswer, HiddenAnswerKind } from '../types';
	import type { Rect } from '@embedpdf/models';
	import { portal } from '$lib/actions/portal';
	import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '$lib/supabase';

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
	let linkUrl = $state('');
	let imageFile = $state<File | null>(null);
	let uploading = $state(false);
	let uploadError = $state('');

	function onFileChange(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		imageFile = input.files?.[0] ?? null;
		uploadError = '';
	}

	// Seçilen görseli Cloudflare R2'ye (ders-kitaplari bucket, hidden-answer-images/
	// klasörü) doğrudan yükler — r2-presign-upload (PDF yükleme) ile AYNI mantık,
	// ayrı bir Supabase Edge Function (r2-presign-image-upload) üzerinden. Gerçek R2
	// kimlik bilgileri tarayıcıya hiç gelmez. Sonuçtaki public URL, Supabase'deki
	// hidden_answers.image_url sütununa kaydedilir — böylece görsel TÜM öğretmenlere
	// ve cihazlara (yalnızca yerelde/tarayıcıda değil) kalıcı olarak görünür.
	async function uploadImage(file: File): Promise<string> {
		const ext = (file.name.split('.').pop() || '').toLowerCase();
		const { data: sessionData } = await supabase.auth.getSession();
		const token = sessionData.session?.access_token;
		if (!token) throw new Error('Oturum bulunamadı, tekrar giriş yap.');
		const presignRes = await fetch(`${SUPABASE_URL}/functions/v1/r2-presign-image-upload`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				apikey: SUPABASE_ANON_KEY,
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ ext })
		});
		const presignData = await presignRes.json();
		if (!presignRes.ok) throw new Error(presignData.error || 'Yükleme linki alınamadı.');
		const putRes = await fetch(presignData.uploadUrl, { method: 'PUT', body: file });
		if (!putRes.ok) throw new Error('Görsel R2\'ye yüklenemedi (HTTP ' + putRes.status + ').');
		return presignData.publicUrl as string;
	}

	async function save() {
		if (kind === 'gorsel') {
			if (!imageFile) {
				uploadError = 'Önce bir görsel seç.';
				return;
			}
			uploading = true;
			uploadError = '';
			try {
				const imageUrl = await uploadImage(imageFile);
				onsave({
					id: crypto.randomUUID(),
					bookId,
					pageNumber,
					kind,
					rect,
					imageUrl,
					linkUrl: linkUrl.trim() || undefined,
					hidden: false,
					createdAt: new Date().toISOString()
				});
			} catch (err) {
				uploadError = err instanceof Error ? err.message : String(err);
			} finally {
				uploading = false;
			}
			return;
		}

		onsave({
			id: crypto.randomUUID(),
			bookId,
			pageNumber,
			kind,
			rect,
			text: kind === 'gizli-metin' || kind === 'metin' ? text : undefined,
			fontSize: 20,
			color: '#111827',
			// 'gizli-metin'/'gizli-alan' varsayılan gizli başlar; 'metin' hiç gizli
			// olmayan, her zaman görünür bir türdür.
			hidden: kind === 'gizli-metin' || kind === 'gizli-alan',
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
		<h3 class="mb-3 text-sm font-bold text-slate-800">🔒 Gizli Cevap / İçerik Ekle</h3>

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
			<button
				type="button"
				onclick={() => (kind = 'metin')}
				class="rounded-md border-2 p-2 text-xs font-medium {kind === 'metin'
					? 'border-blue-500 bg-blue-50'
					: 'border-slate-200'}"
			>
				🅰️ Metin (herkese açık)
			</button>
			<button
				type="button"
				onclick={() => (kind = 'gorsel')}
				class="rounded-md border-2 p-2 text-xs font-medium {kind === 'gorsel'
					? 'border-blue-500 bg-blue-50'
					: 'border-slate-200'}"
			>
				🖼️ Görsel + Link
			</button>
		</div>

		{#if kind === 'gizli-metin' || kind === 'metin'}
			<label class="mb-3 block text-xs font-semibold text-slate-600">
				{kind === 'metin' ? 'Metin (herkese her zaman görünür)' : 'Cevap metni (öğrenciden gizli)'}
				<input
					bind:value={text}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					placeholder={kind === 'metin' ? 'Örn. Not: Sayfa 12 ile bağlantılıdır.' : 'Örn. 472'}
				/>
			</label>
		{:else if kind === 'gizli-alan'}
			<p class="mb-3 text-xs text-slate-500">
				Seçtiğin alan, gizliyken opak bir kapakla örtülecek.
			</p>
		{:else if kind === 'gorsel'}
			<label class="mb-2 block text-xs font-semibold text-slate-600">
				Görsel dosyası
				<input
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
					onchange={onFileChange}
					class="mt-1 w-full text-xs"
				/>
			</label>
			<label class="mb-3 block text-xs font-semibold text-slate-600">
				Link (opsiyonel — tıklayınca açılır)
				<input
					bind:value={linkUrl}
					class="mt-1 w-full rounded border border-slate-300 px-2 py-1 text-sm"
					placeholder="https://..."
				/>
			</label>
			{#if uploadError}
				<p class="mb-2 text-xs font-medium text-red-600">⚠ {uploadError}</p>
			{/if}
		{/if}

		<div class="flex justify-end gap-2">
			<button onclick={oncancel} class="rounded px-3 py-1.5 text-sm text-slate-500 hover:bg-slate-100"
				>İptal</button
			>
			<button
				onclick={save}
				disabled={uploading}
				class="rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
				>{uploading ? 'Yükleniyor…' : kind === 'gizli-metin' || kind === 'gizli-alan' ? 'Ekle (gizli olarak)' : 'Ekle'}</button
			>
		</div>
	</div>
</div>
