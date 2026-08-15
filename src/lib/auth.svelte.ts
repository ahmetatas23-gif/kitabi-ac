import { fetchCurrentUser, signIn as supaSignIn, signOut as supaSignOut, type AuthUser } from './supabase';

export const authState = $state<{ user: AuthUser | null; loading: boolean }>({
	user: null,
	loading: true
});

export async function initAuth() {
	authState.loading = true;
	try {
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
