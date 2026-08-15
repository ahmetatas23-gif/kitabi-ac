<script lang="ts">
	import { useCommand } from '@embedpdf/plugin-commands/svelte';
	import { useFullscreenCapability } from '@embedpdf/plugin-fullscreen/svelte';
	import Icons from './Icons.svelte';
	import ZoomMenu from './ZoomMenu.svelte';
	import { toolbarState } from '$lib/toolbarState.svelte';
	import { teacherStore } from '$lib/teacher/store.svelte';
	import { naturalPenStore, toggleNaturalPen, deactivateNaturalPen } from '$lib/naturalpen/store.svelte';
	import { curtainStore, toggleCurtain } from '$lib/curtain/store.svelte';
	import { useInteractionManager } from '@embedpdf/plugin-interaction-manager/svelte';

	interface Props {
		documentId: string;
	}
	let { documentId }: Props = $props();

	const interactionManager = useInteractionManager(() => documentId);

	function handleNaturalPenToggle() {
		toggleNaturalPen();
		try {
			if (naturalPenStore.active) {
				// ÖNEMLİ: activate() sadece ÖNCEDEN KAYITLI bir mod adını kabul
				// ediyor, aksi halde hata fırlatıp sessizce başarısız oluyor —
				// önceki denemede uydurma 'naturalPen' adı bu yüzden işe
				// yaramadı. Bunun yerine pan eklentisinin GERÇEKTEN kayıtlı
				// olan "panMode" kimliğini kullanıyoruz. Kendi çizim
				// katmanımız bağımsız çalıştığı için "El" aracının asıl
				// kaydırma davranışını tetiklemiyor, sadece göstergeyi düzeltiyor.
				interactionManager.provides?.activate('panMode');
			} else {
				interactionManager.provides?.activateDefaultMode();
			}
		} catch {
			// interaction-manager henüz hazır değilse sessizce geç.
		}
	}

	const TOOL_COMMANDS = [
		'panel:toggle-sidebar',
		'panel:toggle-search',
		'pointer:toggle',
		'annotation:add-ink',
		'annotation:add-ink-highlighter',
		'annotation:add-text',
		'annotation:delete-selected',
		'history:undo',
		'history:redo',
		'zoom:out',
		'zoom:in',
		'pan:toggle',
	] as const;

	const commandRefs = TOOL_COMMANDS.map((id) => ({
		id,
		cmd: useCommand(
			() => id,
			() => documentId,
		),
	}));

	const fullscreen = useFullscreenCapability();

	// --- Konum, yön ve "yapışık" (docked) durumu: localStorage'da kalıcı ---
	const POS_KEY = 'zbook:toolbar-pos';
	const ORIENT_KEY = 'zbook:toolbar-orientation';
	const DOCKED_KEY = 'zbook:toolbar-docked';
	const SIDE_KEY = 'zbook:toolbar-side';
	const DOCK_SNAP_DISTANCE = 80; // px — kenara bu kadar yaklaşınca yapışır
	const approxWidth = 44; // toolbar'ın kabaca genişliği — sağ kenar hesabı için (clampPos'tan önce tanımlı olmalı)

	// Ekran dışına taşmış bir konumu (örn. önceki bir sürüklemede üstten/kenardan
	// çıkmış, ya da farklı/daha küçük bir ekranda kaydedilmiş) görünür alana geri çeker.
	function clampPos(p: { x: number; y: number }) {
		if (typeof window === 'undefined') return p;
		const margin = 4;
		const maxX = Math.max(margin, window.innerWidth - approxWidth - margin);
		const maxY = Math.max(margin, window.innerHeight - approxWidth - margin);
		return {
			x: Math.min(Math.max(p.x, margin), maxX),
			y: Math.min(Math.max(p.y, margin), maxY)
		};
	}
	function loadPos() {
		if (typeof localStorage === 'undefined') return { x: 16, y: 96 };
		try {
			const raw = localStorage.getItem(POS_KEY);
			return raw ? clampPos(JSON.parse(raw)) : { x: 16, y: 96 };
		} catch {
			return { x: 16, y: 96 };
		}
	}
	function loadOrientation(): 'horizontal' | 'vertical' {
		if (typeof localStorage === 'undefined') return 'vertical';
		return (localStorage.getItem(ORIENT_KEY) as 'horizontal' | 'vertical') ?? 'vertical';
	}
	function loadDocked(): boolean {
		if (typeof localStorage === 'undefined') return true;
		const raw = localStorage.getItem(DOCKED_KEY);
		return raw === null ? true : raw === 'true'; // varsayılan: yapışık (sabit sol şerit)
	}
	function loadSide(): 'left' | 'right' {
		if (typeof localStorage === 'undefined') return 'left';
		return (localStorage.getItem(SIDE_KEY) as 'left' | 'right') ?? 'left';
	}

	let pos = $state(loadPos());
	let orientation = $state<'horizontal' | 'vertical'>(loadOrientation());
	toolbarState.docked = loadDocked();
	toolbarState.side = loadSide();
	let dragging = $state(false);
	let dragOffset = { x: 0, y: 0 };

	function startDrag(e: PointerEvent) {
		dragging = true;
		// Yapışıkken sürüklemeye başlarken mevcut (ekrandaki) konumdan başla.
		if (toolbarState.docked) {
			pos =
				toolbarState.side === 'left'
					? { x: 8, y: e.clientY - 24 }
					: { x: window.innerWidth - approxWidth - 8, y: e.clientY - 24 };
		}
		dragOffset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onDrag(e: PointerEvent) {
		if (!dragging) return;
		pos = clampPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
		const nearLeft = pos.x < DOCK_SNAP_DISTANCE;
		const nearRight = pos.x + approxWidth > window.innerWidth - DOCK_SNAP_DISTANCE;
		toolbarState.docked = nearLeft || nearRight;
		if (nearRight) toolbarState.side = 'right';
		else if (nearLeft) toolbarState.side = 'left';
	}
	function endDrag() {
		if (!dragging) return;
		dragging = false;
		localStorage.setItem(POS_KEY, JSON.stringify(pos));
		localStorage.setItem(DOCKED_KEY, String(toolbarState.docked));
		localStorage.setItem(SIDE_KEY, toolbarState.side);
	}
	function toggleOrientation() {
		orientation = orientation === 'vertical' ? 'horizontal' : 'vertical';
		localStorage.setItem(ORIENT_KEY, orientation);
	}

	const effectiveOrientation = $derived(toolbarState.docked ? 'vertical' : orientation);
</script>

<div
	style={toolbarState.docked
		? `position:fixed; ${toolbarState.side}:0; top:0; bottom:0; z-index:500; touch-action:none;`
		: `position:fixed; left:${pos.x}px; top:${pos.y}px; z-index:500; touch-action:none;`}
	class="flex {effectiveOrientation === 'vertical'
		? 'flex-col'
		: 'flex-row'} items-center gap-0.5 {toolbarState.docked
		? `h-full justify-start ${toolbarState.side === 'left' ? 'border-r' : 'border-l'} border-slate-700 bg-slate-800 py-2`
		: 'rounded-lg border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur'}"
>
	<!-- Sürükleme tutamacı -->
	<button
		type="button"
		onpointerdown={startDrag}
		onpointermove={onDrag}
		onpointerup={endDrag}
		aria-label="Araç çubuğunu taşı"
		class="flex h-9 w-9 cursor-move items-center justify-center rounded {toolbarState.docked
			? 'text-slate-400 hover:bg-slate-700'
			: 'text-slate-400 hover:bg-slate-100'} active:bg-slate-600"
	>
		⠿
	</button>

	<div
		class="bg-slate-200 {toolbarState.docked ? 'my-1 h-px w-8 bg-slate-600' : ''} {effectiveOrientation ===
		'vertical'
			? 'h-px w-6'
			: 'hidden'}"
	></div>
	<div
		class="h-6 w-px bg-slate-200 {effectiveOrientation === 'horizontal' ? '' : 'hidden'}"
	></div>

	{#each commandRefs as { cmd } (cmd)}
		{#if cmd.current?.visible}
			<button
				type="button"
				title={cmd.current.label}
				disabled={cmd.current.disabled}
				onclick={() => {
					deactivateNaturalPen();
					cmd.current?.execute();
				}}
				class="flex h-9 w-9 items-center justify-center rounded transition-colors {cmd.current
					.active
					? 'bg-blue-100 text-blue-600'
					: toolbarState.docked
						? 'text-slate-200 hover:bg-slate-700'
						: 'text-slate-700 hover:bg-slate-100'} {cmd.current.disabled
					? 'cursor-not-allowed opacity-40'
					: ''}"
			>
				{#if cmd.current.icon}
					<Icons name={cmd.current.icon} class="h-4 w-4" />
				{/if}
			</button>
		{/if}
	{/each}

	<!-- Doğal Kalem — mevcut kalemin YANINA eklenen, ayrı bir çizim aracı.
	     Mevcut kalem araçlarına (yukarıdaki döngü) hiç dokunulmadı. -->
	<button
		type="button"
		title="Doğal Kalem — daha akıcı, el yazısına yakın çizim"
		onclick={handleNaturalPenToggle}
		class="flex h-9 w-9 items-center justify-center rounded text-sm transition-colors {naturalPenStore.active
			? 'bg-blue-500 text-white'
			: toolbarState.docked
				? 'text-slate-200 hover:bg-slate-700'
				: 'text-slate-700 hover:bg-slate-100'}"
	>
		✒️
	</button>

	<!-- Perdeleme -->
	<button
		type="button"
		title="Perde — sadece belirli bir alanı göster"
		onclick={toggleCurtain}
		class="flex h-9 w-9 items-center justify-center rounded text-sm transition-colors {curtainStore.active
			? 'bg-amber-400 text-slate-900'
			: toolbarState.docked
				? 'text-slate-200 hover:bg-slate-700'
				: 'text-slate-700 hover:bg-slate-100'}"
	>
		🪟
	</button>

	<ZoomMenu {documentId} docked={toolbarState.docked} />

	{#if teacherStore.canToggle}
		<button
			type="button"
			title="Öğretmen Modu (gizli cevapları göster/gizle)"
			onclick={() => teacherStore.toggleTeacherMode()}
			class="flex h-9 w-9 items-center justify-center rounded transition-colors {teacherStore.teacherMode
				? 'bg-amber-400 text-slate-900'
				: toolbarState.docked
					? 'text-slate-200 hover:bg-slate-700'
					: 'text-slate-700 hover:bg-slate-100'}"
		>
			👨‍🏫
		</button>

		{#if teacherStore.teacherMode && teacherStore.canManage}
			<button
				type="button"
				title="Yeni Gizli Cevap Ekle (sürükleyerek çiz) — yalnızca yönetici"
				onclick={() => teacherStore.toggleAddMode()}
				class="flex h-9 w-9 items-center justify-center rounded text-sm transition-colors {teacherStore.addMode
					? 'bg-red-500 text-white'
					: toolbarState.docked
						? 'text-slate-200 hover:bg-slate-700'
						: 'text-slate-700 hover:bg-slate-100'}"
			>
				➕🔒
			</button>
		{/if}
	{/if}

	<button
		type="button"
		title="Tam Ekran"
		onclick={() => fullscreen.provides?.toggleFullscreen()}
		class="flex h-9 w-9 items-center justify-center rounded {toolbarState.docked
			? 'text-slate-200 hover:bg-slate-700'
			: 'text-slate-700 hover:bg-slate-100'}"
	>
		⛶
	</button>

	{#if !toolbarState.docked}
		<button
			type="button"
			title="Araç çubuğu yönünü değiştir"
			onclick={toggleOrientation}
			class="flex h-9 w-9 items-center justify-center rounded text-slate-700 hover:bg-slate-100"
		>
			{orientation === 'vertical' ? '⇄' : '⇅'}
		</button>
	{/if}
</div>
