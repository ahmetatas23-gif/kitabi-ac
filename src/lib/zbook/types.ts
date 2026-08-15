/**
 * Z-Book veri modeli.
 *
 * `AnnualPlanRow`, ahmetatas23-gif/ders-plani projesindeki gerçek "Yıllık Plan"
 * satır şemasıyla BİREBİR eşleşir (bkz. index.html içindeki `weeks.push(...)`
 * ve Notion Worker `/annual-plan` uç noktası). Alan adlarını olduğu gibi
 * koruyoruz ki API'den gelen veri hiçbir dönüşüme gerek kalmadan buraya otursun.
 *
 * `LearningOutcome` ise orijinal proje talimatındaki (bölüm 3) ileri düzey
 * kazanım/kod modelini temsil eder — ders-plani şu an kazanımı serbest metin
 * ("Süreç Bileşenleri") olarak tutuyor, kodlanmış (örn. "MAT.3.1.2") bir yapı
 * yok. Bu tip, ileride resmî MEB kazanım kodları eklenirse kullanılacak;
 * şimdilik boş/opsiyonel bırakılıyor — KAZANIM UYDURULMUYOR.
 */

/** ders-plani API'sindeki bir haftalık yıllık plan satırı (ham veri). */
export interface AnnualPlanRow {
	tema: string;
	hafta_etiketi: string;
	hafta_no: number;
	ders_saati: number;
	/** Ünite/Tema içerik çerçevesi metni */
	icerik: string;
	/** "Süreç Bileşenleri" — serbest metin kazanım/beceri açıklaması */
	kazanim: string;
	/** Öğrenme kanıtları / ölçme-değerlendirme metni */
	olcme: string;
	/** Programlar arası ilişkilendirme metni */
	programlar: string;
	/** Farklılaştırma metni */
	farklilastirma: string;
	/** Belirli gün ve haftalar metni */
	belirli: string;
}

/** İleride resmî MEB kazanım kodu geldiğinde kullanılacak yapı (opsiyonel, şu an boş). */
export interface LearningOutcome {
	code?: string; // örn. "MAT.3.1.2" — GERÇEK MEB kaynağından gelmeden ASLA uydurulmaz
	title?: string;
	theme?: string;
	skill?: string;
	value?: string;
}

/** Sınıf/ders bazında bir "kitap" — bir PDF + ona bağlı yıllık plan verisi. */
export interface ZBook {
	id: string;
	grade: number; // sınıf: 1-4
	subjectId: string; // ders-plani'deki dersId (örn. "matematik")
	subjectLabel: string;
	sube: string; // şube (örn. "A")
	curriculum: 'Türkiye Yüzyılı Maarif Modeli';
	/** Bu kitaba bağlı PDF kaynağı (henüz gerçek MEB PDF'i entegre değilse boş) */
	pdfSrc?: string;
	annualPlan: AnnualPlanRow[];
}

/** Kitaptaki tek bir PDF sayfası ile ilişkilendirilmiş etkinlik/kazanım bağlantısı. */
export interface ZBookPageLink {
	bookId: string;
	pageNumber: number;
	haftaNo?: number; // annualPlan'daki hangi haftaya karşılık geliyor
	learningOutcome?: LearningOutcome;
}

/**
 * Koordinat sistemi kararı (AŞAMA 6):
 *
 * LeedPDF'te olduğu gibi 0-1 aralığında "relative" bir sistem kurmak yerine,
 * EmbedPDF'in kendi annotation motorunun kullandığı PDF SAYFA NOKTA (point)
 * koordinat sistemini birebir kullanıyoruz (`@embedpdf/models`'daki `Rect`,
 * `Position`, `Size` tipleri). Sebebi: bu sistem zaten çözünürlükten/zoom'dan
 * bağımsız (PDF sayfasının kendi koordinat uzayı), ve EmbedPDF'in render
 * katmanı sayfa→ekran dönüşümünü zaten yönetiyor — bunu ikinci kez, kendi
 * relative sistemimizle yeniden icat etmemize gerek yok. Mercek/Cevap Alanı
 * gibi Z-Kitap katmanları, tıpkı bir annotation gibi bu `Rect` ile konumlanır.
 */
import type { Rect } from '@embedpdf/models';

/** Bir Z-Kitap sayfasına eklenen etkileşim alanı (Mercek, Cevap Alanı, vb.) — AŞAMA 5. */
export type InteractionKind =
	| 'mercek'
	| 'cevap-alani'
	| 'video'
	| 'audio'
	| 'metin'
	| 'buton'
	| 'harf-izgara' // config: { cells: string[] } — her hücre 1 karakter, boş string = doldurulacak
	| 'cevap-goster'; // config: { question?: string, answer: string } — tıklayınca cevap açılır

export interface ZBookInteraction {
	id: string;
	bookId: string;
	pageNumber: number; // 1-tabanlı PDF sayfa numarası
	kind: InteractionKind;
	/** PDF sayfa nokta koordinat sisteminde konum/boyut */
	rect: Rect;
	/** İlgili haftaya/kazanıma bağlantı (opsiyonel) */
	haftaNo?: number;
	learningOutcome?: LearningOutcome;
	/** Türe özgü ayarlar (örn. mercek için hedef görsel, video için src) */
	config?: Record<string, unknown>;
}

/** Öğrencinin bir sayfadaki cevap alanına girdiği veri (aynı Rect koordinat sistemiyle). */
export interface ZBookAnswer {
	id: string;
	bookId: string;
	pageNumber: number;
	rect: Rect;
	value: string;
	updatedAt: string; // ISO tarih
}
