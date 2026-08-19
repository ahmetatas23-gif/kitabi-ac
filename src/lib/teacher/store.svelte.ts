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
// ve tüm görüntüleyicilere yansır). image_url/link_url yalnızca 'gorsel'
// türünde dolu olur.
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
	image_url: string | null;
	link_url: string | null;
	font_size: number | null;
	color: string | null;
	line_height: number | null;
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
		imageUrl: r.image_url ?? undefined,
		linkUrl: r.link_url ?? undefined,
		fontSize: r.font_size ?? undefined,
		color: r.color ?? undefined,
		lineHeight: r.line_height ?? undefined,
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
		image_url: a.imageUrl ?? null,
		link_url: a.linkUrl ?? null,
		font_size: a.fontSize ?? null,
		color: a.color ?? null,
		line_height: a.lineHeight ?? null,
		default_hidden: a.hidden
	};
}

class TeacherStoreSupabase {
	// 👨‍🏫 Öğretmen Modu — kapalıyken gizli cevaplar için etkileşim arayüzü
	// hiç render edilmez. Açma/kapama admin VE onaylı editor (öğretmen)
	// rolündeki herkese açık (bkz. canToggle) — böylece birden fazla
	// öğretmen kendi dersinde admin'in hazırladığı gizli cevapları
	// açıp/kapatabilir. Ama içerik oluşturma/silme/taşıma/renk-punto
	// değiştirme SADECE admin'e açık (bkz. canManage).
	// NOT: 'gorsel' ve 'metin' türleri "gizli" değildir, teacherMode'dan
	// BAĞIMSIZ olarak her zaman herkese görünür — teacherMode yalnızca
	// bunların admin tarafından düzenlenebilir/taşınabilir olup olmadığını
	// (düzenleme tutamaçlarının görünürlüğünü) etkiler.
	teacherMode = $state(loadJSON(TEACHER_MODE_KEY, false));

	// ➕ Ekleme Modu — sadece YENİ bir gizli alan/metin/görsel çizerken sayfanın
	// tamamını "yakalar". Sadece admin (canManage) kullanabilir.
	addMode = $state(false);

	answers = $state<HiddenAnswer[]>([]);

	private currentBookId: string | null = null;
	loadError = $state('');

	/** Tam yönetim (ekle/taşı/renk-punto değiştir/sil) — sadece admin. */
	canManage = $derived(!!authState.user?.approved && authState.user?.role === 'admin');

	/** Göster/Gizle aç-kapa — admin + onaylı editor (öğretmen) rolü. Sunucu
	 *  tarafında da (RPC: toggle_hidden_answer) aynı kural ayrıca zorlanıyor,
	 *  bu sadece arayüz için hızlı bir kontrol. */
	canToggle = $derived(
		!!authState.user?.approved &&
			(authState.user?.role === 'admin' || authState.user?.role === 'editor')
	);

	toggleAddMode() {
		if (!this.canManage) return;
		this.addMode = !this.addMode;
	}

	toggleTeacherMode() {
		if (!this.canToggle) {
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
		if (!this.canManage) return;
		// İyimser güncelleme: hemen ekle, hata olursa geri al.
		this.answers.push(answer);
		const { error } = await supabase.from('hidden_answers').insert(answerToRow(answer));
		if (error) {
			this.answers = this.answers.filter((a) => a.id !== answer.id);
			console.error('Gizli cevap kaydedilemedi:', error.message);
		}
	}

	/** Tam alan güncelleme (konum taşıma, punto/renk, görsel linki) — SADECE admin. */
	async update(id: string, patch: Partial<HiddenAnswer>) {
		if (!this.canManage) return;
		const idx = this.answers.findIndex((a) => a.id === id);
		if (idx < 0) return;
		const prev = this.answers[idx];
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
		if (!this.canManage) return;
		const prev = this.answers;
		this.answers = this.answers.filter((a) => a.id !== id);
		const { error } = await supabase.from('hidden_answers').delete().eq('id', id);
		if (error) {
			this.answers = prev;
			console.error('Gizli cevap silinemedi:', error.message);
		}
	}

	/** Göster/Gizle — admin + editor. Dar kapsamlı bir Postgres fonksiyonu
	 *  (RPC) üzerinden çalışır; bu fonksiyon SADECE default_hidden alanını
	 *  değiştirir, metni/konumu/rengi değiştiremez veya silemez — böylece
	 *  bir öğretmen yanlışlıkla ya da kasıtlı olarak admin'in hazırladığı
	 *  içeriği bozamaz/silemez, sadece açıp kapatabilir. 'gorsel'/'metin'
	 *  türleri için hiçbir yerden çağrılmaz (onlarda "gizli" kavramı yok). */
	async toggleHidden(id: string) {
		if (!this.canToggle) return;
		const idx = this.answers.findIndex((a) => a.id === id);
		if (idx < 0) return;
		const prev = this.answers[idx];
		const nextHidden = !prev.hidden;
		this.answers[idx] = { ...prev, hidden: nextHidden };
		const { error } = await supabase.rpc('toggle_hidden_answer', {
			p_id: id,
			p_hidden: nextHidden
		});
		if (error) {
			this.answers[idx] = prev;
			console.error('Gizli cevap açılıp/kapatılamadı:', error.message);
		}
	}

	forPage(bookId: string, pageNumber: number): HiddenAnswer[] {
		return this.answers.filter((a) => a.bookId === bookId && a.pageNumber === pageNumber);
	}

	showAllOnPage(bookId: string, pageNumber: number) {
		for (const a of this.forPage(bookId, pageNumber))
			if (a.hidden && (a.kind === 'gizli-metin' || a.kind === 'gizli-alan')) this.toggleHidden(a.id);
	}

	hideAllOnPage(bookId: string, pageNumber: number) {
		for (const a of this.forPage(bookId, pageNumber))
			if (!a.hidden && (a.kind === 'gizli-metin' || a.kind === 'gizli-alan')) this.toggleHidden(a.id);
	}
}

export const teacherStore = new TeacherStoreSupabase();
