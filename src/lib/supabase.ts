import { createClient } from '@supabase/supabase-js';

// Ana site ile AYNI Supabase projesi — aynı kullanıcı/profiles tablosu,
// tek giriş (email+şifre) her iki uygulamada da geçerli.
export const SUPABASE_URL = 'https://glngkcfllsbgyidiciop.supabase.co';
export const SUPABASE_ANON_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsbmdrY2ZsbHNiZ3lpZGljaW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MDcxNTIsImV4cCI6MjEwMjI4MzE1Mn0.JPW_qzZWYBkJpbRaF_k6dZUiNHXwvQBVXSdZ2o481yY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface AuthUser {
	id: string;
	email: string;
	role: 'admin' | 'editor' | 'viewer';
	name: string;
	approved: boolean;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
	const {
		data: { user }
	} = await supabase.auth.getUser();
	if (!user) return null;
	const { data: profile, error } = await supabase
		.from('profiles')
		.select('role,name,approved')
		.eq('id', user.id)
		.single();
	if (error || !profile) return null;
	return {
		id: user.id,
		email: user.email ?? '',
		role: (profile.role as AuthUser['role']) ?? 'viewer',
		name: profile.name ?? '',
		approved: !!profile.approved
	};
}

export async function signIn(email: string, password: string) {
	const { error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) throw error;
	return fetchCurrentUser();
}

export async function signOut() {
	await supabase.auth.signOut();
}
