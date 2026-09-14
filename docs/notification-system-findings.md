# Namaz Vakti Bildirim Sistemi — Deneysel Bulgular ve Mimari Notları

Bu belge, Android'de güvenilir (özellikle gece/Doze) bildirim altyapısı kurarken keşfedilen
tuzakları ve kurulan çözümleri kayıt altına alır. Yeni bir bildirim sistemi kurarken ya da
mevcut sistemi değiştirirken YARDIMCI OLMAK içindir — genelleme değil, doğrulanmış veridir.

Temel teknoloji: Capacitor (WebView uygulama) + `@capacitor/local-notifications` 6.x (Julia
Stack plugin) + AlarmManager'a dayanan native zamanlayıcı.

---

## 1. En kritik bulgu: AYNI ID'YE İKİNCİ KEZ ALARM KURMAK İLKİNİ İPTAL EDER

### Belirti
- "Test bildirimi" (+1 saniye sonrası, benzersiz ID) HER ZAMAN geliyordu.
- "Şu an X vakti" durum bildirimi (+2 saniye sonrası) HİÇ gelmiyordu.
- İki bildirim de aynı kanalda, aynı native yoldan, aynı `allowWhileIdle` ile planlanıyordu.
- Sistem bildirim ayarlarında tüm kanallar "Kullanılmayan kategoriler" altında görünüyordu
  (kanal tanımı Android'e kayıtlı ama uzun süredir o kanala bildirim DÜŞMEDİĞİ anlamına gelir).

### Kök neden
Durum geçiş zinciri, günün her vaktini `statusId = 9000 + day*100 + idx` deseniyle planlıyor.
Anlık "Şu an" bildirimi de AYNI desenin ID'sini kullanıyordu (ör. bugünün yatsısı → 9005).
Planlama sırası: anlık bildirim önce, geçiş zinciri sonra. Plugin, aynı ID'ye alarm kurarken
(`PendingIntent.getBroadcast(id) + FLAG_CANCEL_CURRENT` ve `cancelTimerForNotification(id)`)
önceki alarmı iptal edip yenisiyle değiştirir. Sonra gelen geçiş, anlık bildirimin alarmını
silip yerine ileri tarihli geçişi koyuyordu → anlık bildirim daha ateşlenemeden YOK OLUYOR.

Bu çakışma çok günlü planlama eklendiğinden beri vardı ve anlık durum bildirimini
"kullanılmayan kategori" olarak da açıklıyordu.

### Çözüm
- Anlık durum bildirimine çakışmayan benzersiz bir ID tabanı kullan (`IMMEDIATE_ID_BASE`,
  hatırlatıcılar ≤6012, geçişler ≥9000 olduğu için 8300 aralığı seçildi).
- Kendini-temizleme: anlık bildirimin `timeoutMs`'ini "bir sonraki vakit geçişine kadar olan
  süre" olarak ayarla → sıradaki gerçek geçiş geldiğinde eski anlık bildirim otomatik kaybolur,
  ekranda iki durum bildirimi birikmez.

### Kural
> Üretilen her bildirim ID'si TÜM sistemde benzersiz olmalıdır. Aynı desenle iki bildirim
> planlamak sessizce birbirini iptal eder; hiçbir hata dönmez. ID aralıklarını tek kaynakta
> tutun ve yorumla (day*100+… gibi).

---

## 2. "Şu an" bildirimini gönderme: zamanlamasız push ÇALIŞMIYOR

Plugin, `schedule` alanı hiç verilmemiş (anında gösterim) bildirimleri bazı Android
sürümlerinde/cihazlarda SESSİZCE kaybediyordu. Güvenilir yol:

- `at: new Date(Date.now() + 2000)` + `allowWhileIdle: true` ile planla.
- Ancak bu bildirimin `at`'sinin planlanma ANINDA hâlâ gelecekte olması gerekir. Büyük bir
  listede döviz/hatırlatıcılarla birlikte geç planlanırsa `at` geriye düşer ve plugin tekrar
  SESSİZCE atar ("Scheduled time must be after current time", `triggerScheduledNotification`).
- Çözüm: anlık bildirimi TÜM diğer kayıtlardan AYRI, kendi tek çağrısıyla ve EN BAŞTA planla.

---

## 3. Dev batch (70+ bildirim) bazı cihazlarda sessizce BAŞARISIZ olabiliyor

### Belirti
- Tek bildirimlik test çağrıları hep başarılı.
- 70+ bildirimlik tek `LocalNotifications.schedule()` çağrısı bazı cihazlarda hata vermeden
  ya hiç sonuç dönmüyor (asılı kalma) ya da içindeki tek bir bildirim native'de takılınca
  grubun tamamı kayboluyor.

### Çözüm (build-apk içinde)
- Bildirimleri **5'erlik parçalara** böl, sırayla gönder.
- Her parçayı `Promise.race(…, 8 saniye timeout)` ile bağla → hiçbir çağrı sessizce asılı kalamaz.
- Parça hatalarını topla, diğer parçaları planlamaya devam et (izolasyon).
- Sonuç `success`, toplam `pending` sayısı ve hata listesiyle dönülür.

---

## 4. `pending()` Android'de güvenilir DEĞİL (yanıltabilir)

- `getPending()` plugin'in **SharedPreferences tabanlı defterinden** okur, AlarmManager'den
  DEĞİL.
- Doğrulanan cihazda (Nothing OS 4.1 / Android 16) schedule() başarılı olsa bile bu çağrı ya
  `0` döndürdü ya da THROW etti. Yani "pending=0" gördüğünde "alarm yok" anlamına gelmez.
- **Alarm sağlığının gerçek kanıtı:** tek bildirimlik test bildiriminin yanına düşmesidir.
  Test geliyorsa kanal + native tetikleme + alarm yolu çalışıyor demektir.
- Bu yüzden tanılamada "Test bildirimi gönder" düğmesi birincil araçtır; `pending()` yalnızca
  bilgi amaçlıdır ve hatayı gösterebilecek şekilde (örn. `-1`) render edilmelidir.

---

## 5. Kesin alarm izni (SCHEDULE_EXACT_ALARM) — Android 13/14+ varsayılan KAPALI

- Manifest'e `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM` eklemek yetmiyor; Android 13+ kullanıcı
  onayı olmadan varsayılan olarak izin vermiyor.
- Plugin davranışı (`setExactIfPossible`):
  - API≥31 ve `!canScheduleExactAlarms()` → `setAndAllowWhileIdle` (izinsiz) → Doze'da
    saatlerce GECİKEBİLİR.
  - İzin açıksa → `setExactAndAllowWhileIdle` → Doze'da bile zamanında ateşler (vakit
    bildiriminin geceleri gelmesi için BU taraf kritik).
- Uygulama içi akış (BatteryHelperPlugin yardımcıları):
  - `canScheduleExactAlarms()` → durumu sor.
  - `openExactAlarmSettings()` → `Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM` (API 31+, bir
    kez çağrılabilir; kullanıcı "Alarmlar ve hatırlatıcılar" sayfasına yönlendirilir).
- Kullanıcıyı yalnızca uygulama açılışında değil, **bildirimler etkinleştirildiği SIRADA**
  hatırlat (mount-time değil, `enabled` state'i değişince tetiklenen effect).

---

## 6. Diğer Doğrulanmış Davranışlar

- `allowWhileIdle: true` her üç planlama türünde de kullanılır (hatırlatıcı, vakit girdi,
  durum geçişleri).
- Kanal adı: Belirli `channelName` verilmezse Android kanala son bildirimin başlığına benzer
  bir isimle kalır (kanal ID değil, görünen isim farklı olabilir). Kanalları adlandırırken
  görünen adı net bir şekilde iletin.
- "Kullanılmayan kategoriler" listed, kanallara uzun süredir bildirim DÜŞMEDİĞİ anlamına
  gelir; kanal engeli değil. Bildirimler düştükçe Android etiketi kendiliğinden düzeltir.
- Oyun/trademark dışı uygulamaların saatler sonra bildirim getirmesi FCM/push tabanlı
  olduğu için alarm tabanlı altyapıyla karşılaştırılamaz; cihazın "hata yapmadığını"
  gösteren kanıt olarak kullanılır.

---

## 7. Tanılama Yaklaşımı (neyin işe yaradığı)

Sorun boyunca işe yarayan yöntem: uygulama içine **görünür tanılama enjekte etmek** (tamamen
console.log'a güvenmemek, WebView'da kullanıcı göremez):

1. "Test bildirimi gönder" ve "Durum kanalını test et" (+2 saniyelik durum kopyası) düğmeleri
   → tek alarm yolunu cihazda anında doğrulama.
2. "Kesin alarm izni: Açık/Kapalı" göstergesi.
3. "Son planlama: ✓ sayı / hata mesajı" + teknik debug satırı (`horizon=7 cur=… next=…` +
   `anlik=OK/YOK`) — planlamanın hangi dalda gittiğini kullanıcının kopyalayabileceği biçimde
   gösterme.
4. Daraltılmış değişken testleri (ID, gecikme, kanal) — her seferinde tek değişkeni izole eden
   küçük butonlar eklemek, analizden daha hızlı sonuç verdi.

---

## 8. Minik özet: "Bildirim hiç gelmiyorsa" kontrol listesi

1. Tek bildirimlik test düşüyor mu? (kanal + alarm + native yol) — düşmüyorsa önce orayı çöz.
2. Bildirim ID'si başka bir planlanan bildirimle çakışıyor mu? (en sık kök neden)
3. Büyük plan tek dev batch olarak mı gidiyor? → parçala.
4. Anlık bildirim `at`'si planlanırken hâlâ gelecekte mi? → geçmişe düşenleri native sessizce atar.
5. Kesin alarm izni AÇIK mı? Kapalıysa gece bildirimleri Doze tarafından şişirilip gecikebilir.
6. Kanallar "Kullanılmayan" listesindeyse, o kanallara kaç gündür gerçek bir gönderim oldu mu?

Belge sahibi: Meccanen / Namaz Vakti uygulama geliştirme notları. Tarih: Eylül 2026