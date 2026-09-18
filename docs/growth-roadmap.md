# Meccanen Prayer Times — Büyüme Yol Haritası (2026 Q4 → 2027 Q1)

Hedef: İlk 6 ayda **10.000 indirme** + **1.000+ aktif kullanıcı (MAU)**.

## Konumlandırma (marka)
Reklamsız · Gizlilik-odaklı · Erişilebilir (büyük yazı) · Çok dilli (tr/en/ar/de/ur) ·
Diyanet (TR) & Karachi (PK) doğruluğu. Rakip devlerin (Muslim Pro, Diyanet vb.)
reklam+veri toplama yükünden ayrışma noktası bunlardır.

## Köşe Taşları (öncelik sırası)
1. **Ölçüm & hata izleme** — gizlilik-dostu analytics (PostHog/TelemetryDeck/Firebase)
   + Sentry. Sayısal hedef için "nereden geldi / neden terk ediyor" verisi şart.
2. **Store (ASO)** — başlık/açıklama/screenshot/anahtar kelimeler tr·ur·de·ar·en
   storefront'larında; simge + feature graphic yenileme; veri güvenliği sayfası,
   içerik derecelendirmesi. 10K'nın ~%60-70'i arama/önerme trafiği.
3. **Ana ekran widget'ları** — en yüksek getiri (tutunma + marka görünürlüğü):
   - **Sayısal widget (4x2)**: bugünün 6 vakti + başlık satırında şehir ve
     "sonraki vakte kalan" geri sayımı; sonraki vakit vurgulu.
   - **Sematik widget (3x3)**: 24 saatin tam daire halkası — 6 vakit ayrı renkli
     dilimler (kerahat yapısının tüm vakitlere genişletilmiş hali) + şimdiki
     zamanda dönen ibre + merkezde sonraki vakit/süre.
   - Kullanıcı **16 temadan dilediğini widget'ta da** gösterir (WidgetPalettes +
     `widget_bg_<tema>` yuvarlak arka planlar); dil seçimiyle vakit adları yerelleşir.
   - Durum: **v1 kodlandı** (`native/widget/` → CI build'e kopyalanır) — JS
     `widgetBridge` vakit/şehir/tema/dil/zaman dilimini SharedPreferences'a iter,
     `WidgetCore` sonraki vakit + kalanı hesaplar, her vakit geçişinde + gece
     yarısında exact alarmla, boot/saat/dilim değişiminde `WidgetRefreshReceiver`
     tazeler. CI build'inde derlenip doğrulanacak.
4. **Ramazan paketi (imsakiye + ekstra)** — bakınız aşağıda.

## Ramazan 1448 (8 Şubat 2027 - ~9 Mart 2027) — KRİTİK
- **Hazırlık başlangıcı: Ocak 2027 başı (Ramazan'dan 1 ay önce).**
- İçerik:
  - **İmsakiye görünümü**: günlük imsak-sahur/iftar + takvim (aylık listelenebilir).
  - **Sahur & iftar özel bildirimleri** (Ramazan modu).
  - Fıtır sadakası/fitre tutarı, bayram duyurusu (1 Şevval ~9-10 Mart 2027).
  - Ramazan'a özel tema/arayüz dokunuşu + "bi'smi" paylaşılabilir imsakiye kartı.
- Lansman/yükseltme dalgası Ramazan *öncesi 2 haftaya* bindirilir.

## Hızlı kazanımlar (quick wins) — ilk ay
- "Vakti paylaş" görseli (bugünün vakitleri → WhatsApp paylaşım kartı).
- Tasbih/hamd sayacı (dijital zikir tesbihi).
- Günün ayeti/hadisi (günlük değişen içerik + bildirim rotasyonu).
- İn-app nazik "Beğendiysen puanla" istemi.
- İlk gün onboarding sadeleştirme (3 adım).

## Orta vadeli (2. - 5. ay)
- Widget v1: sayısal 4x2 + sematik (kodlandı — CI ile v1 üretimde).
- Widget v1.5: yapılandırma (gösterilecek metot/şehir, sayısal 4x1).
- Haftalık namaz takvimi görünümü + dakika düzeltme (adjust) ayarı.
- "Vakit bildirimi + alarm birlikte" seçeneği (imsak öncesi alarm).
- Topluluk: WhatsApp/Telegram grupları, cami QR posterleri (TR + PK).
- Sosyal: TikTok/Reels/Shorts (sonraki vakte kalan sayacı, Esma içerikleri),
  Ramazan öncesi bölgesel reklam testi.
- (Ops.) iOS sürümü — Capacitor hazır, faz-2 (ay ~5-6).

## Altı aylık kronoloji (özet)
- Ay 1-2: Ölçüm + hata izleme, ASO tamamlama, quick wins, onboarding.
- Ay 3: Widget v1, haftalık takvim, alarm seçeneği.
- Ay 4-5: Ramazan paketi + kampanya + topluluk kanalları (Ocak başından itibaren hazırlık).
- Ay 6: Veriye göre yenileme, 4.5★ sürdürme, iOS kararı.

## Ölçülenler (KPI)
- İndirme (store), MAU/WAU, D0/D7/D30 tutunma, bildirim açma oranı,
  widget ekleme oranı, ülke/dil kırılımı, kilitli İspat: rating & yorum sayısı.