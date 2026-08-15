# Kitabı Aç — Kurulum

Bu, ana "Haftalık Ders Planı" sitesinden bağımsız, küçük bir SvelteKit
sitesidir. Ders kitabı PDF'lerini açar; öğretmen için "Gizli Öğretmen
Cevapları", Doğal Kalem, Perdeleme ve tam EmbedPDF araç çubuğunu (arama,
küçük resimler, damga, imza, form, vb.) içerir. Giriş yapan kullanıcı ana
siteyle **aynı** Supabase hesabını kullanır; sadece **admin** rolündeki
kullanıcı Öğretmen Modu'nu açıp gizli cevap ekleyebilir/düzenleyebilir.

## 1) Yayınlama (GitHub Pages — wrangler'a gerek yok)

Proje zaten hazır bir GitHub Actions iş akışıyla geliyor
(`.github/workflows/deploy.yml`). Tek yapman gereken:

1. GitHub'da yeni, **boş** bir repo oluştur (örn. `kitabi-ac`).
2. Bu klasördeki tüm dosyaları o repoya push'la:
   ```bash
   git init
   git add .
   git commit -m "ilk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/kitabi-ac.git
   git push -u origin main
   ```
3. GitHub'da repo → **Settings → Pages** → "Build and deployment" → Source
   olarak **GitHub Actions** seç.
4. Push sonrası **Actions** sekmesinden yayının bitmesini bekle (1-2 dakika).
5. Site adresin: `https://KULLANICI_ADIN.github.io/kitabi-ac/`

Wrangler/Cloudflare deploy'a gerek yok — sadece `git push` yeterli, her
push otomatik yeniden yayınlar.

## 2) Yerelde test etmek istersen

```bash
npm install
npm run dev
```

`http://localhost:5173/?url=<PDF adresi>&id=<kitap kimliği>&title=<başlık>`
adresini aç.

## 3) Kitap linki formatı

Ana sitenin Yönetim Paneli → 📖 Ders Kitapları sekmesine eklenecek link:

```
https://KULLANICI_ADIN.github.io/kitabi-ac/?url=<PDF-ADRESI>&id=<sinif>-<ders>&title=<baslik>
```

- `url` — PDF'in kendi adresi (CORS + Range destekli bir yerde barındırılmalı;
  GitHub Pages, Google Drive doğrudan indirme linki gibi).
- `id` — bu kitaba özgü, sabit bir kimlik (gizli cevaplar bu kimliğe göre
  saklanır — aynı kitap için hep aynı `id`'yi kullan).
- `title` — sekme başlığında görünecek isim (opsiyonel).

## 4) Öğretmen Modu / Gizli Cevaplar

- Sağ altta 👨‍🏫 butonunu sadece **admin** rolündeki kullanıcı görür.
- Ekranın altındaki "🛡️ Yönetici Girişi" ile ana siteyle aynı e-posta/şifre
  ile giriş yapılır.
- Admin, sürükleyerek yeni bir gizli alan/metin çizip kaydedebilir; bu
  kayıtlar Supabase'de saklanır ve tüm görüntüleyicilere (öğrencilere)
  gösterilir/gizlenir — yani öğretmenin gösterdiği/gizlediği an, projeksiyon/
  akıllı tahtadaki herkes aynı anda görür.
- Öğrenciler (admin olmayanlar) düzenleme yapamaz; sadece gizlenmiş
  alanları kilitli/perdeli görür.

## 5) Ana siteye dönüş

Üst gezinme çubuğundaki "← Ana Siteye Dön" linki her zaman
`https://ahmetatas23-gif.github.io/ders-plani/` adresine gider. Site adresin
değişirse `src/lib/site-config.ts` içindeki `MAIN_SITE_URL` değerini güncelle.
