import {
	fetchCurrentUser,
	signIn as supaSignIn,
	signOut as supaSignOut,
	supabase,
	type AuthUser
} from './supabase';

export const authState = $state<{ user: AuthUser | null; loading: boolean }>({
	user: null,
	loading: true
});

// Ana site ("Haftalık Ders Planı") ve kitabi-ac AYNI alan adında (ahmetatas23-gif.github.io)
// barındığı için — sadece klasör yolu farklı — tarayıcının localStorage'ı zaten ikisi
// arasında PAYLAŞILIYOR (origin = protokol+host+port, yol değil). Ana site oturumunu
// kendi 'supaSession' anahtarında saklıyor (bkz. index.html); burada aynı anahtarı okuyup
// Supabase istemcisine devrederek ayrıca giriş yapmaya gerek bırakmıyoruz.
const MAIN_SITE_SESSION_KEY = 'supaSession';

async function inheritMainSiteSession() {
	try {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(MAIN_SITE_SESSION_KEY);
		if (!raw) return;
		const saved = JSON.parse(raw) as { access_token?: string; refresh_token?: string } | null;
		if (!saved?.access_token || !saved?.refresh_token) return;

		// kitabi-ac'ta zaten geçerli bir oturum varsa (örn. ayrıca giriş yapılmışsa)
		// üzerine yazma — sadece hiç oturum yoksa ana sitenin oturumunu devral.
		const { data } = await supabase.auth.getSession();
		if (data.session) return;

		await supabase.auth.setSession({
			access_token: saved.access_token,
			refresh_token: saved.refresh_token
		});
	} catch {
		// Devralma başarısız olursa sessizce geç — "🛡️ Yönetici Girişi" formu
		// her zaman yedek olarak çalışmaya devam eder.
	}
}

export async function initAuth() {
	authState.loading = true;
	try {
		await inheritMainSiteSession();
		authState.user = await fetchCurrentUser();
	} finally {
		authState.loading = false;
	}
}

export async function login(email: string, password: string) {
	const user = await supaSignIn(email, password);
	authState.user = user;
	return user;
}

export async function logout() {
	await supaSignOut();
	authState.user = null;
}
