<script lang="ts">
	import { useDocumentState } from '@embedpdf/core/svelte';
	import { teacherStore } from '../store.svelte';
	import type { HiddenAnswer } from '../types';
	import type { Rect } from '@embedpdf/models';
	import HiddenAnswerForm from './HiddenAnswerForm.svelte';
	import HiddenAnswerSettings from './HiddenAnswerSettings.svelte';

	interface Props {
		documentId: string; // bookId olarak kullanılıyor
		pageIndex: number; // 0-tabanlı
	}
	let { documentId, pageIndex }: Props = $props();

	const documentState = useDocumentState(() => documentId);
	const scale = $derived(documentState.current?.scale ?? 1);
	const pageNumber = $derived(pageIndex + 1);

	const answers = $derived(teacherStore.forPage(documentId, pageNumber));
	// 'gorsel' ve 'metin' — gizli DEĞİL, admin hazırladığında teacherMode'dan
	// bağımsız olarak HER ZAMAN herkese görünür (bkz. types.ts notu).
	const alwaysVisibleAnswers = $derived(
		answers.filter((a) => a.kind === 'gorsel' || a.kind === 'metin')
	);

	function styleFor(rect: Rect) {
		// touch-action:none — dokunmatik cihazlarda tarayıcının bu öğeyi "kaydırma" jesti
		// sanıp sürükle-taşı/tıkla-aç-kapa olaylarımızla çakışmasını (ve bu yüzden öğenin
		// yanlışlıkla kayıp/yerinden oynamış görünmesini) engeller.
		return `position:absolute; left:${rect.origin.x * scale}px; top:${rect.origin.y * scale}px; width:${rect.size.width * scale}px; height:${rect.size.height * scale}px; pointer-events:auto; touch-action:none;`;
	}

	let pageEl = $state<HTMLDivElement | null>(null);
	function pagePoint(clientX: number, clientY: number) {
		const box = pageEl?.getBoundingClientRect();
		if (!box) return { x: 0, y: 0 };
		return { x: (clientX - box.left) / scale, y: (clientY - box.top) / scale };
	}

	// --- Yeni gizli cevap alanı çizme — SADECE Ekleme Modu (➕🔒) açıkken.
	//     Arka plan div'i başka zaman pointer-events:none — bu sayede
	//     Öğretmen Modu açıkken bile kalem/diğer araçlar normal çalışır. ---
	let dragStart = $state<{ x: number; y: number } | null>(null);
	let dragRectPx = $state<{ x: number; y: number; w: number; h: number } | null>(null);
	let draftRect = $state<Rect | null>(null);
	let draftScreenPos = { x: 0, y: 0 };

	function handleBackgroundPointerDown(e: PointerEvent) {
		if (!teacherStore.addMode) return;
		if (e.target !== e.currentTarget) return;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		dragStart = pagePoint(e.clientX, e.clientY);
		dragRectPx = { x: e.offsetX, y: e.offsetY, w: 0, h: 0 };
	}
	function handleBackgroundPointerMove(e: PointerEvent) {
		if (!teacherStore.addMode || !dragStart) return;
		const cur = pagePoint(e.clientX, e.clientY);
		const x = Math.min(dragStart.x, cur.x);
		const y = Math.min(dragStart.y, cur.y);
		dragRectPx = {
			x: x * scale,
			y: y * scale,
			w: Math.abs(cur.x - dragStart.x) * scale,
			h: Math.abs(cur.y - dragStart.y) * scale
		};
	}
	function handleBackgroundPointerUp(e: PointerEvent) {
		if (!teacherStore.addMode || !dragStart) return;
		const cur = pagePoint(e.clientX, e.clientY);
		const x = Math.min(dragStart.x, cur.x);
		const y = Math.min(dragStart.y, cur.y);
		const w = Math.abs(cur.x - dragStart.x);
		const h = Math.abs(cur.y - dragStart.y);
		dragStart = null;
		dragRectPx = null;
		if (w < 10 / scale || h < 10 / scale) return;
		draftScreenPos = { x: e.clientX, y: e.clientY };
		draftRect = { origin: { x, y }, size: { width: w, height: h } };
		// Tek çizimden sonra Ekleme Modu'ndan otomatik çık — "sürükle-bırak
		// yine aktif oluyor ve çıkmıyor" karışıklığını önler. Başka bir tane
		// eklemek istersen ➕🔒'ya tekrar basman yeterli.
		teacherStore.addMode = false;
	}

	// --- Mevcut öğeyi sürükleyerek taşıma — SADECE Ekleme Modu KAPALIYKEN.
	//     (Ekleme Modu açıkken üst üste gelen sürükleme çakışmasını önlemek
	//     için mevcut öğeler taşınamaz, sadece tıklanabilir kalır.) ---
	const MOVE_THRESHOLD = 6;
	let movingId = $state<string | null>(null);
	let moveStartClient = { x: 0, y: 0 };
	let moveStartOrigin = { x: 0, y: 0 };
	let moved = false;

	function startItemDrag(e: PointerEvent, a: HiddenAnswer) {
		if (!teacherStore.teacherMode) return;
		e.stopPropagation();
		if (teacherStore.addMode) return; // Ekleme Modu'nda mevcut öğeler taşınmaz
		if (!teacherStore.canManage) return; // Taşıma sadece yönetici — editor'lar sadece tıklayarak aç/kapa yapabilir
		movingId = a.id;
		moved = false;
		moveStartClient = { x: e.clientX, y: e.clientY };
		moveStartOrigin = { x: a.rect.origin.x, y: a.rect.origin.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onItemDrag(e: PointerEvent, a: HiddenAnswer) {
		if (movingId !== a.id) return;
		const dxPx = e.clientX - moveStartClient.x;
		const dyPx = e.clientY - moveStartClient.y;
		if (!moved && Math.hypot(dxPx, dyPx) < MOVE_THRESHOLD) return;
		moved = true;
		const newOrigin = {
			x: moveStartOrigin.x + dxPx / scale,
			y: moveStartOrigin.y + dyPx / scale
		};
		teacherStore.update(a.id, { rect: { ...a.rect, origin: newOrigin } });
	}
	function endItemDrag(e: PointerEvent, a: HiddenAnswer) {
		if (movingId !== a.id) {
			// Ekleme Modu yüzünden sürükleme hiç başlamadıysa yine de tıklama sayılsın:
			if (teacherStore.teacherMode && !teacherStore.addMode) return;
			return;
		}
		e.stopPropagation();
		movingId = null;
		if (!moved) {
			if (a.kind === 'gizli-metin' || a.kind === 'gizli-alan') {
				teacherStore.toggleHidden(a.id);
			} else if (a.kind === 'gorsel' && a.linkUrl) {
				window.open(a.linkUrl, '_blank', 'noopener,noreferrer');
			}
			// 'metin' → tıklamanın hiçbir etkisi yok (düz, her zaman görünür yazı)
		}
		moved = false;
	}
	function handleItemClick(a: HiddenAnswer) {
		// addMode'da VEYA yönetici olmayan (editor) kullanıcılarda drag hiç
		// kurulmadığı için (bkz. startItemDrag) normal click üzerinden aç/kapa.
		if (teacherStore.teacherMode && (teacherStore.addMode || !teacherStore.canManage)) {
			teacherStore.toggleHidden(a.id);
		}
	}

	// --- Ayar paneli (punto/renk/link/sil) ---
	let settingsFor = $state<string | null>(null);
	function settingsStyle(a: HiddenAnswer) {
		const top = a.rect.origin.y * scale - 44;
		const left = a.rect.origin.x * scale;
		return `position:absolute; left:${left}px; top:${Math.max(0, top)}px;`;
	}

	// Form popup'ını çizilen dikdörtgenin YANINA konumlandır (ekran ortası değil).
	function formStyle() {
		const box = pageEl?.getBoundingClientRect();
		const left = Math.min((draftScreenPos.x ?? 0) + 12, (box?.right ?? 9999) - 260);
		const top = Math.min((draftScreenPos.y ?? 0) + 12, (window?.innerHeight ?? 9999) - 260);
		return `position:fixed; left:${Math.max(8, left)}px; top:${Math.max(8, top)}px;`;
	}
</script>

<div
	bind:this={pageEl}
	style="position:absolute; inset:0; touch-action:none; {teacherStore.addMode
		? 'cursor:crosshair; pointer-events:auto;'
		: 'pointer-events:none;'}"
	onpointerdown={handleBackgroundPointerDown}
	onpointermove={handleBackgroundPointerMove}
	onpointerup={handleBackgroundPointerUp}
	role="presentation"
>
	{#if dragRectPx}
		<div
			style="position:absolute; left:{dragRectPx.x}px; top:{dragRectPx.y}px; width:{dragRectPx.w}px; height:{dragRectPx.h}px; border:2px dashed #dc2626; background:rgba(220,38,38,0.1); pointer-events:none;"
		></div>
	{/if}

	{#each answers as a (a.id)}
		{#if a.kind === 'gizli-alan' && a.hidden}
			<!-- Maske: sayfanın ÜSTÜNDE (pozitif z-index), tam opak — alttaki
			     basılı içeriği gerçekten örtüyor. -->
			<div
				style={styleFor(a.rect) + 'pointer-events:none; z-index:10; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);'}
				class="bg-slate-200"
			></div>
		{/if}
	{/each}

	{#each answers as a (a.id)}
		{#if a.hidden}
			{#if teacherStore.teacherMode}
				<!-- Kilitli öğe: ŞEFFAF — sadece 🔒 simgesi görünür, çerçeve/arka
				     plan yok. Silme (✕) butonu sadece üzerine gelince belirir. -->
				<div
					style={styleFor(a.rect) + 'z-index:20;'}
					onpointerdown={(e) => startItemDrag(e, a)}
					onpointermove={(e) => onItemDrag(e, a)}
					onpointerup={(e) => endItemDrag(e, a)}
					onclick={() => handleItemClick(a)}
					role="button"
					tabindex="0"
					title="Sürükleyerek taşı, tıklayarak göster"
					class="group flex cursor-move items-center justify-center rounded-md hover:bg-red-50/40"
				>
					<span class="text-base opacity-70 group-hover:opacity-100">🔒</span>
					{#if teacherStore.canManage}
						<button
							type="button"
							title="Sil"
							onpointerdown={(e) => e.stopPropagation()}
							onclick={(e) => {
								e.stopPropagation();
								teacherStore.remove(a.id);
							}}
							class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow opacity-0 group-hover:opacity-100 hover:bg-red-700"
						>
							✕
						</button>
					{/if}
				</div>
			{/if}
		{:else if a.kind === 'gizli-metin'}
			<div
				style={styleFor(a.rect) + 'z-index:20;'}
				onpointerdown={(e) => startItemDrag(e, a)}
				onpointermove={(e) => onItemDrag(e, a)}
				onpointerup={(e) => endItemDrag(e, a)}
				onclick={() => handleItemClick(a)}
				role="button"
				tabindex="0"
				class="group flex items-center {teacherStore.teacherMode ? 'cursor-move' : ''}"
			>
				<span
					class="pointer-events-none select-none"
					style="font-size:{(a.fontSize ?? 20) * scale}px; color:{a.color ?? '#111827'};"
				>
					{a.text}
				</span>
				{#if teacherStore.canManage}
					<button
						type="button"
						title="Sil"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							teacherStore.remove(a.id);
						}}
						class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow opacity-0 group-hover:opacity-100 hover:bg-red-700"
					>
						✕
					</button>
					<!-- Ayarlar (punto/renk) — silme (✕) butonuyla birebir aynı davranış: imleç
					     üzerine gelmeden tamamen görünmez (opacity-0), sadece bu öğenin üzerine
					     gelince (group-hover) belirir. Önceden sürekli hafif görünür (opacity-60)
					     kalıyordu ve ekranda dikkat dağıtıyordu. -->
					<button
						type="button"
						title="Ayarlar (punto/renk) — yalnızca yönetici"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							settingsFor = settingsFor === a.id ? null : a.id;
						}}
						style="position:absolute; left:100%; top:0; margin-left:4px; z-index:25; pointer-events:auto;"
						class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-white opacity-0 shadow group-hover:opacity-100 hover:bg-slate-700"
					>
						⚙
					</button>
				{/if}
			</div>
		{:else if a.kind === 'gizli-alan' && teacherStore.teacherMode}
			<!-- Alan gösterilmiş: şeffaf, sadece hover'da hafif belirti + sil butonu -->
			<div
				style={styleFor(a.rect) + 'z-index:20;'}
				onpointerdown={(e) => startItemDrag(e, a)}
				onpointermove={(e) => onItemDrag(e, a)}
				onpointerup={(e) => endItemDrag(e, a)}
				onclick={() => handleItemClick(a)}
				role="button"
				tabindex="0"
				title="Sürükleyerek taşı, tıklayarak tekrar gizle"
				class="group cursor-move rounded-md hover:bg-emerald-50/30"
			>
				{#if teacherStore.canManage}
					<button
						type="button"
						title="Sil"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							teacherStore.remove(a.id);
						}}
						class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow opacity-0 group-hover:opacity-100 hover:bg-red-700"
					>
						✕
					</button>
				{/if}
			</div>
		{/if}
	{/each}

	<!-- 'metin' ve 'gorsel' — gizli DEĞİL, teacherMode'dan bağımsız her zaman
	     herkese görünür. Düzenleme tutamaçları (taşı/⚙/sil) yalnızca admin +
	     Öğretmen Modu açıkken görünür; diğer herkes (öğretmen/misafir) sadece
	     içeriği görür ve (gorsel için) linke tıklayabilir. -->
	{#each alwaysVisibleAnswers as a (a.id)}
		{#if a.kind === 'metin'}
			{#if teacherStore.teacherMode && teacherStore.canManage}
				<div
					style={styleFor(a.rect) + 'z-index:20;'}
					onpointerdown={(e) => startItemDrag(e, a)}
					onpointermove={(e) => onItemDrag(e, a)}
					onpointerup={(e) => endItemDrag(e, a)}
					role="button"
					tabindex="0"
					title="Sürükleyerek taşı"
					class="group flex cursor-move items-center"
				>
					<span
						class="pointer-events-none select-none"
						style="font-size:{(a.fontSize ?? 20) * scale}px; color:{a.color ?? '#111827'};"
					>
						{a.text}
					</span>
					<button
						type="button"
						title="Sil"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							teacherStore.remove(a.id);
						}}
						class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow opacity-0 group-hover:opacity-100 hover:bg-red-700"
					>
						✕
					</button>
					<button
						type="button"
						title="Ayarlar (punto/renk) — yalnızca yönetici"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							settingsFor = settingsFor === a.id ? null : a.id;
						}}
						style="position:absolute; left:100%; top:0; margin-left:4px; z-index:25; pointer-events:auto;"
						class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-white opacity-0 shadow group-hover:opacity-100 hover:bg-slate-700"
					>
						⚙
					</button>
				</div>
			{:else}
				<div style={styleFor(a.rect) + 'z-index:20; pointer-events:none;'} class="flex items-center">
					<span
						class="select-none"
						style="font-size:{(a.fontSize ?? 20) * scale}px; color:{a.color ?? '#111827'};"
					>
						{a.text}
					</span>
				</div>
			{/if}
		{:else if a.kind === 'gorsel'}
			{#if teacherStore.teacherMode && teacherStore.canManage}
				<div
					style={styleFor(a.rect) + 'z-index:20;'}
					onpointerdown={(e) => startItemDrag(e, a)}
					onpointermove={(e) => onItemDrag(e, a)}
					onpointerup={(e) => endItemDrag(e, a)}
					role="button"
					tabindex="0"
					title="Sürükleyerek taşı, tıklayarak linki test et"
					class="group cursor-move"
				>
					<img
						src={a.imageUrl}
						alt=""
						draggable="false"
						class="pointer-events-none h-full w-full select-none object-contain"
					/>
					<button
						type="button"
						title="Sil"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							teacherStore.remove(a.id);
						}}
						class="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] text-white shadow opacity-0 group-hover:opacity-100 hover:bg-red-700"
					>
						✕
					</button>
					<button
						type="button"
						title="Ayarlar (link) — yalnızca yönetici"
						onpointerdown={(e) => e.stopPropagation()}
						onclick={(e) => {
							e.stopPropagation();
							settingsFor = settingsFor === a.id ? null : a.id;
						}}
						style="position:absolute; left:100%; top:0; margin-left:4px; z-index:25; pointer-events:auto;"
						class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] text-white opacity-0 shadow group-hover:opacity-100 hover:bg-slate-700"
					>
						⚙
					</button>
				</div>
			{:else}
				<div
					style={styleFor(a.rect) + 'z-index:20;' + (a.linkUrl ? 'cursor:pointer;' : 'pointer-events:none;')}
					onclick={() => {
						if (a.linkUrl) window.open(a.linkUrl, '_blank', 'noopener,noreferrer');
					}}
					role={a.linkUrl ? 'link' : 'presentation'}
					tabindex={a.linkUrl ? 0 : -1}
				>
					<img
						src={a.imageUrl}
						alt=""
						draggable="false"
						class="pointer-events-none h-full w-full select-none object-contain"
					/>
				</div>
			{/if}
		{/if}
	{/each}

	{#each answers as a (a.id)}
		{#if settingsFor === a.id}
			<HiddenAnswerSettings answer={a} style={settingsStyle(a)} onclose={() => (settingsFor = null)} />
		{/if}
	{/each}
</div>

{#if draftRect}
	<HiddenAnswerForm
		bookId={documentId}
		{pageNumber}
		rect={draftRect}
		popupStyle={formStyle()}
		onsave={(a) => {
			teacherStore.add(a);
			draftRect = null;
		}}
		oncancel={() => (draftRect = null)}
	/>
{/if}
