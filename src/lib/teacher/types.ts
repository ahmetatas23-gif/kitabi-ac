/**
 * Gizli Öğretmen Cevapları / Hidden Layer (talimat §39).
 *
 * Bu, PDF'nin kendisini DEĞİŞTİRMEZ — ayrı, PDF-nokta koordinatlı bir
 * annotation katmanı (bkz. AŞAMA 6 kararı: EmbedPDF'in kendi annotation
 * motoruyla aynı `rect` koordinat sistemi kullanılıyor).
 *
 * Kapsam notu: "Gizli Metin" (öğretmenin önceden yazdığı, öğrenciden gizli
 * cevap) ve "Gizli Alan" (PDF üzerindeki bir bölgeyi örten maske) ilk sürümden
 * beri var. Sonradan eklenen "Görsel" (gorsel) ve "Metin" (metin) ise GİZLİ
 * DEĞİL — admin hazırladığında TÜM öğretmenlere her zaman görünür (bkz.
 * store.svelte.ts canManage/canToggle ayrımı); bunlar, EmbedPDF'in kendi
 * localStorage-tabanlı (yalnızca tek cihazda kalıcı olan) native görsel/link/
 * metin araçlarının YERİNE, aynı Supabase-destekli admin-only-CRUD mimarisini
 * kullanarak eklendi — böylece tüm cihazlarda/öğretmenlerde tutarlı kalırlar.
 * "Gizli Kalem" (§39'da bahsedilen serbest çizim) EmbedPDF'in kendi ink
 * aracıyla çakışacağı ve ayrı bir çizim yakalama arayüzü gerektireceği için
 * bu sürümde YOK — istenirse ayrıca ele alınmalı.
 */
import type { Rect } from '@embedpdf/models';

export type HiddenAnswerKind = 'gizli-metin' | 'gizli-alan' | 'gorsel' | 'metin';

export interface HiddenAnswer {
	id: string;
	bookId: string;
	pageNumber: number; // 1-tabanlı
	kind: HiddenAnswerKind;
	rect: Rect; // PDF nokta koordinatı
	text?: string; // 'gizli-metin' ve 'metin' için
	imageUrl?: string; // yalnızca 'gorsel' için (R2 üzerindeki public URL)
	linkUrl?: string; // yalnızca 'gorsel' için, opsiyonel (tıklayınca açılır)
	fontSize?: number; // 'gizli-metin' ve 'metin' için
	color?: string; // 'gizli-metin' ve 'metin' için
	/** true: öğrenciden gizli. false: açık/görünür. Silinmez, sadece bu değişir.
	 *  NOT: 'gorsel' ve 'metin' için bu HER ZAMAN false'tur ve hiç değişmez —
	 *  bu iki tür zaten "gizli cevap" değil, her zaman görünür içeriktir. */
	hidden: boolean;
	createdAt: string;
}
