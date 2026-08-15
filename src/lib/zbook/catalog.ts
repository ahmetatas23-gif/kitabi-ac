// ahmetatas23-gif/ders-plani projesindeki CATALOG_BY_GRADE ile birebir aynı
// (kaynak: index.html). Ders id'leri Worker'daki /annual-plan sorgusuyla
// eşleşmesi için buradan değiştirilmemeli.

export interface CatalogSubject {
	id: string;
	label: string;
}

export const CATALOG_BY_GRADE: Record<number, CatalogSubject[]> = {
	1: [
		{ id: 'turkce', label: '📙 Türkçe' },
		{ id: 'matematik', label: '📐 Matematik' },
		{ id: 'hayat-bilgisi', label: '📘 Hayat Bilgisi' },
		{ id: 'gorsel', label: '🎨 Görsel Sanatlar' },
		{ id: 'muzik', label: '🎵 Müzik' },
		{ id: 'beden', label: '🏃 Beden Eğitimi ve Oyun' },
		{ id: 'serbest', label: '⚪ Serbest Etkinlikler' }
	],
	2: [
		{ id: 'turkce', label: '📙 Türkçe' },
		{ id: 'matematik', label: '📐 Matematik' },
		{ id: 'hayat-bilgisi', label: '📘 Hayat Bilgisi' },
		{ id: 'ingilizce', label: '🇬🇧 Yabancı Dil' },
		{ id: 'gorsel', label: '🎨 Görsel Sanatlar' },
		{ id: 'muzik', label: '🎵 Müzik' },
		{ id: 'beden', label: '🏃 Beden Eğitimi ve Oyun' },
		{ id: 'serbest', label: '⚪ Serbest Etkinlik' }
	],
	3: [
		{ id: 'turkce', label: '📙 Türkçe' },
		{ id: 'matematik', label: '📐 Matematik' },
		{ id: 'hayat-bilgisi', label: '📘 Hayat Bilgisi' },
		{ id: 'fen-bilimleri', label: '🔬 Fen Bilimleri' },
		{ id: 'ingilizce', label: '🇬🇧 Yabancı Dil' },
		{ id: 'gorsel', label: '🎨 Görsel Sanatlar' },
		{ id: 'muzik', label: '🎵 Müzik' },
		{ id: 'beden', label: '🏃 Beden Eğitimi ve Oyun' },
		{ id: 'serbest', label: '⚪ Serbest Etkinlik' }
	],
	4: [
		{ id: 'turkce', label: '📙 Türkçe' },
		{ id: 'matematik', label: '📐 Matematik' },
		{ id: 'fen-bilimleri', label: '🔬 Fen Bilimleri' },
		{ id: 'sosyal-bilgiler', label: '🌍 Sosyal Bilgiler' },
		{ id: 'ingilizce', label: '🇬🇧 Yabancı Dil' },
		{ id: 'din-kulturu', label: '☪️ Din Kültürü ve Ahlak Bilgisi' },
		{ id: 'gorsel', label: '🎨 Görsel Sanatlar' },
		{ id: 'muzik', label: '🎵 Müzik' },
		{ id: 'beden', label: '🏃 Beden Eğitimi' },
		{ id: 'trafik-guvenligi', label: '🚦 Trafik Güvenliği' },
		{ id: 'insan-haklari', label: '🤝 İnsan Hakları, Vatandaşlık ve Demokrasi' }
	]
};
