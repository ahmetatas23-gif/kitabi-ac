<script lang="ts">
	import { authState, login, logout } from '$lib/auth.svelte';

	let open = $state(false);
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

	// --- Sürükle-taşı + küçült/genişlet: konum ve daraltılmış (collapsed) durum
	//     localStorage'da kalıcı olur. Varsayılan konum, eski sabit yerle (üstten
	//     56px, sağdan ~12px) aynı görünecek şekilde hesaplanır. FloatingToolbar'daki
	//     ile aynı sürükleme deseni (ayrı bir tutamaç, clampPos ile ekran dışına
	//     taşmayı engelleme) burada da kullanılıyor. ---
	const POS_KEY = 'zbook:adminbadge-pos';
	const COLLAPSED_KEY = 'zbook:adminbadge-collapsed';
	let boxEl = $state<HTMLDivElement | null>(null);

	function defaultPos() {
		if (typeof window === 'undefined') return { x: 0, y: 56 };
		return { x: Math.max(4, window.innerWidth - 210), y: 56 };
	}
	function clampPos(p: { x: number; y: number }) {
		if (typeof window === 'undefined') return p;
		const margin = 4;
		const w = boxEl?.offsetWidth || 40;
		const h = boxEl?.offsetHeight || 32;
		const maxX = Math.max(margin, window.innerWidth - w - margin);
		const maxY = Math.max(margin, window.innerHeight - h - margin);
		return { x: Math.min(Math.max(p.x, margin), maxX), y: Math.min(Math.max(p.y, margin), maxY) };
	}
	function loadPos() {
		if (typeof localStorage === 'undefined') return defaultPos();
		try {
			const raw = localStorage.getItem(POS_KEY);
			return raw ? clampPos(JSON.parse(raw)) : defaultPos();
		} catch {
			return defaultPos();
		}
	}
	function loadCollapsed() {
		if (typeof localStorage === 'undefined') return false;
		return localStorage.getItem(COLLAPSED_KEY) === 'true';
	}

	let pos = $state(loadPos());
	let collapsed = $state(loadCollapsed());
	let dragging = $state(false);

	function startDrag(e: PointerEvent) {
		dragging = true;
		const dragOffset = { x: e.clientX - pos.x, y: e.clientY - pos.y };
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
		const onMove = (ev: PointerEvent) => {
			if (!dragging) return;
			pos = clampPos({ x: ev.clientX - dragOffset.x, y: ev.clientY - dragOffset.y });
		};
		const onUp = () => {
			dragging = false;
			localStorage.setItem(POS_KEY, JSON.stringify(pos));
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerup', onUp);
		};
		window.addEventListener('pointermove', onMove);
		window.addEventListener('pointerup', onUp);
	}
	function toggleCollapsed() {
		collapsed = !collapsed;
		localStorage.setItem(COLLAPSED_KEY, String(collapsed));
	}

	async function submit(e: Event) {
		e.preventDefault();
		error = '';
		busy = true;
		try {
			const user = await login(email, password);
			if (!user) {
				error = 'Giriş başarısız.';
			} else if (user.role !== 'admin') {
				error = 'Bu hesap yönetici değil — Öğretmen Modu düzenleme yetkisi yok.';
			} else {
				open = false;
				email = '';
				password = '';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Giriş başarısız.';
		} finally {
			busy = false;
		}
	}
</script>

<div bind:this={boxEl} style="position:fixed; left:{pos.x}px; top:{pos.y}px; z-index:600; touch-action:none;">
	{#if collapsed}
		<!-- Daraltılmış hâl: tek küçük yuvarlak buton, tıklayınca tekrar açılır. -->
		<button
			type="button"
			title="Genişlet"
			onclick={toggleCollapsed}
			class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/95 text-base shadow-lg backdrop-blur hover:bg-white"
		>
			🛡️
		</button>
	{:else}
		<div class="flex items-center gap-1">
			{#if authState.user}
				<div
					class="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur"
				>
					<span class={authState.user.role === 'admin' ? 'text-emerald-700' : 'text-slate-500'}>
						{authState.user.role === 'admin' ? '🛡️ Yönetici' : '👤'}
						{authState.user.name || authState.user.email}
					</span>
					<button
						type="button"
						onclick={() => logout()}
						class="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600 hover:bg-slate-200"
					>
						Çıkış
					</button>
				</div>
			{:else if open}
				<form
					onsubmit={submit}
					class="flex w-64 flex-col gap-2 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs shadow-xl backdrop-blur"
				>
					<div class="flex items-center justify-between">
						<span class="font-semibold text-slate-700">🛡️ Yönetici Girişi</span>
						<button
							type="button"
							onclick={() => (open = false)}
							class="text-slate-400 hover:text-slate-600">✕</button
						>
					</div>
					<input
						type="email"
						bind:value={email}
						placeholder="E-posta"
						required
						class="rounded border border-slate-300 px-2 py-1"
					/>
					<input
						type="password"
						bind:value={password}
						placeholder="Şifre"
						required
						class="rounded border border-slate-300 px-2 py-1"
					/>
					{#if error}
						<div class="rounded bg-red-50 px-2 py-1 text-red-700">{error}</div>
					{/if}
					<button
						type="submit"
						disabled={busy}
						class="rounded bg-emerald-600 px-2 py-1 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
					>
						{busy ? 'Giriş yapılıyor...' : 'Giriş Yap'}
					</button>
				</form>
			{:else}
				<button
					type="button"
					onclick={() => (open = true)}
					class="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-[11px] text-slate-500 shadow backdrop-blur hover:bg-white"
				>
					🛡️ Yönetici Girişi
				</button>
			{/if}

			<!-- Sürükleme tutamacı: her durumda görünür, ayrı bir buton — böylece
			     taşıma ile tıklama (giriş/çıkış/gönder) birbirine karışmaz. -->
			<button
				type="button"
				title="Taşı (sürükle)"
				onpointerdown={startDrag}
				class="flex h-6 w-6 shrink-0 cursor-move items-center justify-center self-start rounded-full border border-slate-200 bg-white/80 text-[11px] text-slate-400 shadow backdrop-blur hover:bg-white hover:text-slate-600"
			>
				⠿
			</button>
			<!-- Küçültme tutamacı: sağa doğru daraltır. -->
			<button
				type="button"
				title="Küçült"
				onclick={toggleCollapsed}
				class="flex h-6 w-6 shrink-0 items-center justify-center self-start rounded-full border border-slate-200 bg-white/80 text-[11px] text-slate-400 shadow backdrop-blur hover:bg-white hover:text-slate-600"
			>
				»
			</button>
		</div>
	{/if}
</div>
