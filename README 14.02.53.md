# MEB Ders Kitabı Web PDF Çalışma Alanı — v19: İki kenara yapışma

## YENİ: Araç çubuğu artık hem sola hem sağa yapışabiliyor

Önceden sadece sol kenara yapışıyordu. Artık:

- Tutamaçtan (⠿) tutup sürükle
- **Sol kenara** yaklaştırırsan sol tarafa yapışır
- **Sağ kenara** yaklaştırırsan sağ tarafa yapışır
- Hangi kenara yapıştıysa, içerik alanı (PDF) otomatik olarak o taraftan
  boşluk bırakır — üzerine binmez
- Tercih (hangi kenar, konum) `localStorage`'da hatırlanır

### Test etme

```bash
npm install
npm run dev
```

1. Araç çubuğunu tutamacından tutup ekranın sağına doğru sürükle —
   sağ kenara yapışmalı.
2. Sayfa içeriğinin sağdan boşluk bıraktığını, araç çubuğunun üzerine
   binmediğini doğrula.
3. Tekrar sola sürükleyip sol kenara yapıştığını kontrol et.
4. Sayfayı yenile — son bıraktığın kenarda kalmalı.

## Önceki güncellemeler
- v18: Ok butonu — gerçek düzeltme (panMode kullanımı)
- v17: Üst çubuk sadeleştirme
- v16: Range-request + PDF linearize
- v6-v15: Gizli Öğretmen Cevapları, Perdeleme, Doğal Kalem, Zoom menüsü, Annotation kalıcılığı

## Lisans
MIT lisanslı EmbedPDF paketlerine bağımlıdır.
