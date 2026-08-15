import type { AnnualPlanRow, ZBookAnswer, ZBookInteraction } from './types';
import { fetchAnnualPlan } from './api';

const ANSWERS_STORAGE_KEY = 'zbook:answers';
const INTERACTIONS_STORAGE_KEY = 'zbook:interactions';

function loadJSON<T>(key: string, fallback: T): T {
	if (typeof localStorage === 'undefined') return fallback;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : fallback;
	} catch {
		return fallback;
	}
}

function saveJSON(key: string, value: unknown) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(key, JSON.stringify(value));
}

class ZBookStore {
	// Aktif seçim (sınıf / ders / şube)
	grade = $state<number | null>(null);
	subjectId = $state<string | null>(null);
	sube = $state('');

	// ders-plani'den çekilen yıllık plan (haftalara göre kazanım/süreç bileşenleri)
	annualPlan = $state<AnnualPlanRow[]>([]);
	isLoadingPlan = $state(false);
	planError = $state<string | null>(null);

	// Öğrenci cevapları — şimdilik localStorage'da, AŞAMA 4+'ta IndexedDB'ye taşınabilir.
	answers = $state<ZBookAnswer[]>(loadJSON(ANSWERS_STORAGE_KEY, [] as ZBookAnswer[]));

	// Sayfa üzerindeki etkileşim tanımları (Mercek, Cevap Alanı, ...) — AŞAMA 5.
	interactions = $state<ZBookInteraction[]>(
		loadJSON(INTERACTIONS_STORAGE_KEY, [] as ZBookInteraction[])
	);

	// AŞAMA 16 (Editör): Düzenleme modu — açıkken sayfa üzerinde dikdörtgen
	// çizerek yeni etkileşim eklenebilir.
	editMode = $state(false);

	toggleEditMode() {
		this.editMode = !this.editMode;
	}

	/** Seçili sınıf/ders/şube için ders-plani'den yıllık planı çeker. */
	async loadAnnualPlan(grade: number, subjectId: string, sube = '') {
		this.grade = grade;
		this.subjectId = subjectId;
		this.sube = sube;
		this.isLoadingPlan = true;
		this.planError = null;
		try {
			this.annualPlan = await fetchAnnualPlan(grade, subjectId, sube);
		} catch (err) {
			this.planError = err instanceof Error ? err.message : 'Bilinmeyen hata';
			this.annualPlan = [];
		} finally {
			this.isLoadingPlan = false;
		}
	}

	/** Belirli bir hafta numarasına ait satırı döner (sayfa ↔ hafta eşleşmesi için). */
	weekRow(haftaNo: number): AnnualPlanRow | undefined {
		return this.annualPlan.find((r) => r.hafta_no === haftaNo);
	}

	saveAnswer(answer: ZBookAnswer) {
		const idx = this.answers.findIndex((a) => a.id === answer.id);
		if (idx >= 0) this.answers[idx] = answer;
		else this.answers.push(answer);
		saveJSON(ANSWERS_STORAGE_KEY, this.answers);
	}

	answersForPage(bookId: string, pageNumber: number): ZBookAnswer[] {
		return this.answers.filter((a) => a.bookId === bookId && a.pageNumber === pageNumber);
	}

	addInteraction(interaction: ZBookInteraction) {
		const idx = this.interactions.findIndex((i) => i.id === interaction.id);
		if (idx >= 0) this.interactions[idx] = interaction;
		else this.interactions.push(interaction);
		saveJSON(INTERACTIONS_STORAGE_KEY, this.interactions);
	}

	removeInteraction(id: string) {
		this.interactions = this.interactions.filter((i) => i.id !== id);
		saveJSON(INTERACTIONS_STORAGE_KEY, this.interactions);
	}

	interactionsForPage(bookId: string, pageNumber: number): ZBookInteraction[] {
		return this.interactions.filter((i) => i.bookId === bookId && i.pageNumber === pageNumber);
	}

	/** Bir kitabın tüm etkileşimlerini dışa aktarır (editör → JSON dosyası). */
	interactionsForBook(bookId: string): ZBookInteraction[] {
		return this.interactions.filter((i) => i.bookId === bookId);
	}

	/**
	 * Bir kitabın statik `interactions.json` dosyasını yükler ve mevcutlara
	 * ekler (aynı id varsa tekrar eklemez). Dosya yoksa (404) sessizce hiçbir
	 * şey yapmaz — henüz içerik hazırlanmamış bir kitap için normaldir.
	 */
	async loadBookInteractionsFromJson(bookId: string, url: string) {
		try {
			const res = await fetch(url);
			if (!res.ok) return;
			const data = (await res.json()) as ZBookInteraction[];
			const existingIds = new Set(this.interactionsForBook(bookId).map((i) => i.id));
			for (const i of data) {
				if (!existingIds.has(i.id)) this.addInteraction(i);
			}
		} catch {
			// Dosya yok veya bozuk — sessizce geç, editör modunda sıfırdan oluşturulabilir.
		}
	}
}

export const zbookStore = new ZBookStore();
