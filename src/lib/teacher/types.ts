/**
 * Gizli Öğretmen Cevapları / Hidden Layer (talimat §39).
 *
 * Bu, PDF'nin kendisini DEĞİŞTİRMEZ — ayrı, PDF-nokta koordinatlı bir
 * annotation katmanı (bkz. AŞAMA 6 kararı: EmbedPDF'in kendi annotation
 * motoruyla aynı `rect` koordinat sistemi kullanılıyor).
 *
 * Kapsam notu: İlk sürümde "Gizli Metin" (öğretmenin önceden yazdığı cevap)
 * ve "Gizli Alan" (PDF üzerindeki bir bölgeyi örten maske) destekleniyor.
 * "Gizli Kalem" (§39'da bahsedilen serbest çizim) EmbedPDF'in kendi ink
 * aracıyla çakışacağı ve ayrı bir çizim yakalama arayüzü gerektireceği için
 * bu sürümde YOK — istenirse ayrıca ele alınmalı.
 */
import type { Rect } from '@embedpdf/models';

export type HiddenAnswerKind = 'gizli-metin' | 'gizli-alan';

export interface HiddenAnswer {
	id: string;
	bookId: string;
	pageNumber: number; // 1-tabanlı
	kind: HiddenAnswerKind;
	rect: Rect; // PDF nokta koordinatı
	text?: string; // yalnızca 'gizli-metin' için
	fontSize?: number;
	color?: string;
	/** true: öğrenciden gizli. false: açık/görünür. Silinmez, sadece bu değişir. */
	hidden: boolean;
	createdAt: string;
}
