<script lang="ts">
	import { authState, login, logout } from '$lib/auth.svelte';

	let open = $state(false);
	let email = $state('');
	let password = $state('');
	let error = $state('');
	let busy = $state(false);

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

<div class="fixed bottom-3 left-1/2 z-[600] -translate-x-1/2">
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
</div>
