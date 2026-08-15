import type { AnnualPlanRow } from './types';

/**
 * ders-plani'nin yıllık plan verisini kendi sunucu proxy'imiz üzerinden çeker.
 * (Doğrudan Worker'a client'tan gitmiyoruz — bkz. +server.ts içindeki not.)
 */
export async function fetchAnnualPlan(
	grade: number,
	subjectId: string,
	sube = ''
): Promise<AnnualPlanRow[]> {
	const params = new URLSearchParams({ grade: String(grade), subject: subjectId, sube });
	const res = await fetch(`/api/ders-plani/annual-plan?${params}`);

	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body?.message ?? `Yıllık plan alınamadı (${res.status})`);
	}

	return (await res.json()) as AnnualPlanRow[];
}
