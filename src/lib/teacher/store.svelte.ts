import type { HiddenAnswer } from './types';
import { supabase } from '$lib/supabase';
import { authState } from '$lib/auth.svelte';

const TEACHER_MODE_KEY = 'zbook:teacher-mode';

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

// Supabase satırı <-> uygulama tipi dönüşümü.
// NOT: hidden_answers tablosunda rect tek bir jsonb değil, ayrı sütunlar
// olarak tutuluyor (rect_x/rect_y/rect_width/rect_height); "hidden" alanı
// da tablo kolonunda default_hidden adıyla saklanıyor ama YAŞAYAN/güncel
// gizlilik durumu olarak kullanılıyor (öğretmen değiştirince kalıcı olur
// ve tüm görüntüleyicilere yansır).
interface HiddenAnswerRow {
	id: string;
	book_id: string;
	page_number: number;
	kind: HiddenAnswer['kind'];
	rect_x: number;
	rect_y: number;
	rect_width: number;
	rect_height: number;
	text: string | null;
	font_size: number | null;
	color: string | null;
	default_hidden: boolean;
	created_at: string;
}

function rowToAnswer(r: HiddenAnswerRow): HiddenAnswer {
	return {
		id: r.id,
		bookId: r.book_id,
		pageNumber: r.page_number,
		kind: r.kind,
		rect: {
			origin: { x: r.rect_x, y: r.rect_y },
			size: { width: r.rect_width, height: r.rect_height }
		},
		text: r.text ?? undefined,
		fontSize: r.font_size ?? undefined,
		color: r.color ?? undefined,
		hidden: r.default_hidden,
		createdAt: r.created_at
	};
}

function answerToRow(a: HiddenAnswer) {
	return {
		id: a.id,
		book_id: a.bookId,
		page_number: a.pageNumber,
		kind: a.kind,
		rect_x: a.rect.origin.x,
		rect_y: a.rect.origin.y,
		rect_width: a.rect.size.width,
		rect_height: a.rect.size.height,
		text: a.text ?? null,
		font_size: a.fontSize ?? null,
		color: a.color ?? null,
		default_hidden: a.hidden
	};
}

class TeacherStoreSupabase {
	// 👨‍🏫 Öğretmen Modu — kapalıyken gizli cevaplar için düzenleme arayüzü
	// hiç render edilmez. Açma/kapama SADECE admin'e (bkz. FloatingToolbar
	// gate) sunulur; ama gizlenmiş içerik (maskeler/kilitler) her zaman
	// herkese görünür — öğrenci onların cevap olduğunu bilmez, sadece bir
	// perde/kilit görür.
	teacherMode = $state(loadJSON(TEACHER_MODE_KEY, false));

	// ➕ Ekleme Modu — sadece YENİ bir gizli alan/metin çizerken sayfanın
	// tamamını "yakalar".
	addMode = $state(false);

	answers = $state<HiddenAnswer[]>([]);

	private currentBookId: string | null = null;
	private saving = $state(false);
	loadError = $state('');

	/** Sadece admin (Supabase profiles.role === 'admin') düzenleyebilir. */
	canEdit = $derived(authState.user?.role === 'admin');

	toggleAddMode() {
		if (!this.canEdit) return;
		this.addMode = !this.addMode;
	}

	toggleTeacherMode() {
		if (!this.canEdit) {
			this.teacherMode = false;
			return;
		}
		this.teacherMode = !this.teacherMode;
		if (!this.teacherMode) this.addMode = false;
		saveJSON(TEACHER_MODE_KEY, this.teacherMode);
	}

	/** Kitap değişince (veya sayfa ilk yüklenince) o kitabın gizli cevaplarını çeker. Herkese açık okuma. */
	async loadForBook(bookId: string) {
		if (this.currentBookId === bookId) return;
		this.currentBookId = bookId;
		this.loadError = '';
		const { data, error } = await supabase
			.from('hidden_answers')
			.select('*')
			.eq('book_id', bookId);
		if (error) {
			this.loadError = error.message;
			this.answers = [];
			return;
		}
		this.answers = (data as HiddenAnswerRow[]).map(rowToAnswer);
	}

	async add(answer: HiddenAnswer) {
		if (!this.canEdit) return;
		// İyimser güncelleme: hemen ekle, hata olursa geri al.
		this.answers.push(answer);
		const { error } = await supabase.from('hidden_answers').insert(answerToRow(answer));
		if (error) {
			this.answers = this.answers.filter((a) => a.id !== answer.id);
			console.error('Gizli cevap kaydedilemedi:', error.message);
		}
	}

	async update(id: string, patch: Partial<HiddenAnswer>) {
		const idx = this.answers.findIndex((a) => a.id === id);
		if (idx < 0) return;
		const prev = this.answers[idx];
		if (!this.canEdit) {
			// Öğretmen olmayanlar hiçbir yazma işlemi yapamaz (toggleHidden
			// dahil — çünkü hidden alanı da sunucuda tutuluyor ve public'e
			// açık; öğrenci tarafında değişmemesi gerekiyor).
			return;
		}
		this.answers[idx] = { ...prev, ...patch };
		const { error } = await supabase
			.from('hidden_answers')
			.update(answerToRow(this.answers[idx]))
			.eq('id', id);
		if (error) {
			this.answers[idx] = prev;
			console.error('Gizli cevap güncellenemedi:', error.message);
		}
	}

	async remove(id: string) {
		if (!this.canEdit) return;
		const prev = this.answers;
		this.answers = this.answers.filter((a) => a.id !== id);
		const { error } = await supabase.from('hidden_answers').delete().eq('id', id);
		if (error) {
			this.answers = prev;
			console.error('Gizli cevap silinemedi:', error.message);
		}
	}

	toggleHidden(id: string) {
		const a = this.answers.find((a) => a.id === id);
		if (a) this.update(id, { hidden: !a.hidden });
	}

	forPage(bookId: string, pageNumber: number): HiddenAnswer[] {
		return this.answers.filter((a) => a.bookId === bookId && a.pageNumber === pageNumber);
	}

	showAllOnPage(bookId: string, pageNumber: number) {
		for (const a of this.forPage(bookId, pageNumber)) this.update(a.id, { hidden: false });
	}

	hideAllOnPage(bookId: string, pageNumber: number) {
		for (const a of this.forPage(bookId, pageNumber)) this.update(a.id, { hidden: true });
	}
}

export const teacherStore = new TeacherStoreSupabase();
