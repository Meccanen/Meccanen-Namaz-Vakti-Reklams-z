package meccanen.namaz.vakti.v1.widgets;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

/**
 * Widget'ların ortak beyni: JS'den gelen JSON payload'ı saklar, o anki vakte göre
 * "sonraki vakit"i hesaplar, her vakit geçişinde ve gece yarısında widget'ları
 * tazelemek için exact alarmlar programlar.
 *
 * Payload şeması (JS `widgetBridge`'den veya native `WidgetSyncWorker`'dan):
 * {
 *   "days": [ { "date":"2026-09-18", "times":[ {"n":"İmsak","t":"04:49"}, ... 6 ] }, xN ],
 *   "city": "Istanbul, Türkiye",
 *   "theme": "gece",
 *   "lang": "tr",
 *   "tz": "Europe/Istanbul",
 *   "lat": 41.0082, "lng": 28.9784, "method": 13
 * }
 *
 * `days` en fazla `MAX_DAYS` gün tutulur. JS 7 gün gönderir; native worker günde
 * bir kez 30 güne kadar tazeler. Böylece uygulama açılmadan da widget bayatlamaz.
 */
public final class WidgetCore {

    private WidgetCore() {}

    public static final String PREFS       = "mpw_prefs";
    public static final String KEY_PAYLOAD = "payload";
    public static final String ACTION_REFRESH = "meccanen.namaz.vakti.v1.widgets.REFRESH";
    public static final int ALARM_REQ_BASE = 7100;

    /** Widget'ın taşıyabileceği en fazla gün. 30 gün ≈ 6-8 KB payload. */
    public static final int MAX_DAYS = 30;

    public static final String[] KEYS = {"imsak", "gunes", "ogle", "ikindi", "aksam", "yatsi"};

    // Saat widget'ı için ayrı alarm istek kodu (prayer/midnight 7100..7106'dan ayrı).
    public static final int ALARM_REQ_CLOCK = 7107;

    public static final class PrayTime {
        public String name;
        public int mins; // gün içi dakika (0..1439)
    }

    public static final class Data {
        public JSONObject raw;
        public String date;
        public String city;
        public String theme;
        public String lang;
        public String tz;
        public final PrayTime[][] days = new PrayTime[MAX_DAYS][6];
        public final int[] noonMins = new int[MAX_DAYS]; // her günün istiva/zeval dakikası
        // Saat/takvim widget'ı için gün bazlı yerelleştirilmiş alanlar (JS/worker'dan gelir).
        public final String[] dates = new String[MAX_DAYS]; // YYYY-MM-DD
        public final String[] wd = new String[MAX_DAYS]; // haftanın günü
        public final String[] gd = new String[MAX_DAYS]; // miladi gün
        public final String[] gm = new String[MAX_DAYS]; // miladi ay + yıl
        public final String[] hd = new String[MAX_DAYS]; // hicri gün
        public final String[] hm = new String[MAX_DAYS]; // hicri ay
        public final String[] hy = new String[MAX_DAYS]; // hicri yıl
        public final String[] mp = new String[MAX_DAYS]; // ay fazı
        public final int[] mi = new int[MAX_DAYS];       // ay aydınlanma %
        public int todayIndex = 0;   // bugünle eşleşen gün (0..decoded-1)
        public int decoded = 0;      // kaç gün başarıyla çözüldü
        public boolean stale = false; // payload bugünü kapsamıyor (son gün gösteriliyor)
    }

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static String savedPayload(Context c) {
        return prefs(c).getString(KEY_PAYLOAD, null);
    }

    /**
     * JS'den gelen payload'ı sakla. Gelen veri daha kısa olsa bile (ör. çok günlük
     * istek başarısız olduğunda 1 gün) önceki uzun payload'daki ileri günleri korur;
     * böylece widget bir anda 30 günlük veriyi kaybetmez.
     */
    public static void saveAndUpdate(Context c, String payload) {
        String merged = mergePayloads(c, payload);
        prefs(c).edit().putString(KEY_PAYLOAD, merged).apply();
        refreshAll(c);
    }

    /**
     * Native worker'ın ürettiği tam payload'ı saklar. Worker çalışırken kullanıcı
     * tema/dil/konum değiştirdiyse eski ayarlarla üretilmiş veriyi yazmaz.
     */
    public static void saveFromWorker(Context c, String payload) {
        String existing = savedPayload(c);
        if (existing != null) {
            try {
                JSONObject prev = new JSONObject(existing);
                // Eski sürüm payload'ında konum yoksa aynıConfig karşılaştırması
                // yapılamaz; worker'ın taze verisini yazmasına izin ver.
                boolean prevHasLocation = !Double.isNaN(prev.optDouble("lat", Double.NaN))
                        && !Double.isNaN(prev.optDouble("lng", Double.NaN));
                if (prevHasLocation && !sameConfig(prev, new JSONObject(payload))) return;
            } catch (Exception ignored) {
                // eski payload bozuksa yeni veri yine de yazılsın
            }
        }
        prefs(c).edit().putString(KEY_PAYLOAD, payload).apply();
        refreshAll(c);
    }

    /**
     * Yeni payload'ın kapsamadığı ileri günleri eski payload'dan ekler. Yalnızca
     * şehir/tema/dil/zaman dilimi/konum/metot aynıysa birleştirir; ayar değiştiyse
     * eski günlerin etiketleri geçersiz olacağı için yeni payload tek başına kalır.
     */
    private static String mergePayloads(Context c, String incoming) {
        String old = savedPayload(c);
        if (old == null) return incoming;
        try {
            JSONObject neu = new JSONObject(incoming);
            JSONObject prev = new JSONObject(old);
            JSONArray nd = neu.optJSONArray("days");
            JSONArray pd = prev.optJSONArray("days");
            if (nd == null || nd.length() == 0) return incoming;
            if (pd == null || pd.length() <= nd.length()) return incoming;
            if (!sameConfig(prev, neu)) return incoming;

            JSONObject lastNew = nd.optJSONObject(nd.length() - 1);
            String lastDate = lastNew == null ? "" : lastNew.optString("date", "");

            JSONArray merged = new JSONArray();
            for (int i = 0; i < nd.length() && merged.length() < MAX_DAYS; i++) {
                merged.put(nd.get(i));
            }
            for (int i = 0; i < pd.length() && merged.length() < MAX_DAYS; i++) {
                JSONObject day = pd.optJSONObject(i);
                if (day == null) continue;
                if (day.optString("date", "").compareTo(lastDate) > 0) merged.put(day);
            }
            if (merged.length() <= nd.length()) return incoming;
            neu.put("days", merged);
            return neu.toString();
        } catch (Exception e) {
            return incoming;
        }
    }

    static boolean sameConfig(JSONObject a, JSONObject b) {
        if (!a.optString("city", "").equals(b.optString("city", ""))) return false;
        if (!a.optString("theme", "").equals(b.optString("theme", ""))) return false;
        if (!a.optString("lang", "").equals(b.optString("lang", ""))) return false;
        if (!a.optString("tz", "").equals(b.optString("tz", ""))) return false;
        if (a.optInt("method", 13) != b.optInt("method", 13)) return false;
        double alat = a.optDouble("lat", Double.NaN);
        double blat = b.optDouble("lat", Double.NaN);
        double alng = a.optDouble("lng", Double.NaN);
        double blng = b.optDouble("lng", Double.NaN);
        if (Double.isNaN(alat) || Double.isNaN(blat) || Math.abs(alat - blat) > 0.0005) return false;
        if (Double.isNaN(alng) || Double.isNaN(blng) || Math.abs(alng - blng) > 0.0005) return false;
        return true;
    }

    public static void refreshAll(Context c) {
        Data d = loadData(c);
        if (d == null) return;
        AppWidgetManager mgr = AppWidgetManager.getInstance(c);
        updateProvider(c, mgr, PrayerArcWidgetProvider.class, d);
        updateProvider(c, mgr, PrayerClockWidgetProvider.class, d);
        updateProvider(c, mgr, PrayerAnalogWidgetProvider.class, d);
        updateProvider(c, mgr, PrayerGridWidgetProvider.class, d);
        // Widget eklendi/kaldırıldı ya da veri değişti → dakika-başı + vakit alarmlarını
        // yeniden kur. Bu, "widget eklenince alarm kurulmuyor" hatasını önler.
        scheduleRefreshAlarms(c);
    }

    private static void updateProvider(Context c, AppWidgetManager mgr, Class<?> provider, Data d) {
        ComponentName cn = new ComponentName(c, provider);
        int[] ids = mgr.getAppWidgetIds(cn);
        for (int id : ids) {
            try {
                mgr.updateAppWidget(id, buildFor(c, provider, id, d));
            } catch (Exception ignored) {
                // tek widget hatalıysa uygulama etkilenmesin
            }
        }
    }

    private static RemoteViews buildFor(Context c, Class<?> provider, int id, Data d) {
        if (provider == PrayerClockWidgetProvider.class) return PrayerClockWidgetProvider.buildViews(c, id, d);
        if (provider == PrayerAnalogWidgetProvider.class) return PrayerAnalogWidgetProvider.buildViews(c, id, d);
        if (provider == PrayerGridWidgetProvider.class) return PrayerGridWidgetProvider.buildViews(c, id, d);
        return PrayerArcWidgetProvider.buildViews(c, id, d);
    }

    /**
     * Widget'a tıklanınca ana uygulamayı açar. Bütün Android sürümlerinde (bilhassa
     * Android 12+ / eski model cihazlarda) çalışması için manifest launcher intent'i
     * doğrudan kullanılır; PendingIntent mutlaka FLAG_IMMUTABLE içermeli.
     */
    public static void setOpenAppClick(Context c, RemoteViews views, int rootViewId, int... extraViewIds) {
        Intent intent = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        if (intent != null) {
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(
                    c, 0, intent,
                    PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);
            views.setOnClickPendingIntent(rootViewId, pi);
            for (int id : extraViewIds) {
                views.setOnClickPendingIntent(id, pi);
            }
        }
    }

    // ---------------------------------------------------------------- veri çözümleme

    public static Data loadData(Context c) {
        String s = savedPayload(c);
        if (s == null) return null;
        try {
            JSONObject raw = new JSONObject(s);
            Data d = new Data();
            d.raw = raw;
            d.city = raw.optString("city", "");
            d.theme = raw.optString("theme", "gece");
            d.lang = raw.optString("lang", "en");
            d.tz = raw.optString("tz", "");
            JSONArray days = raw.optJSONArray("days");
            if (days == null) return null;
            int n = Math.min(days.length(), MAX_DAYS);
            for (int i = 0; i < n; i++) {
                JSONObject day = days.optJSONObject(i);
                if (day == null) continue;
                d.days[i] = parseTimes(day.optJSONArray("times"));
                String noon = day.optString("noon", "");
                int mn = noon.isEmpty() ? 0 : toMinutes(noon);
                if (mn <= 0) {
                    int sr = d.days[i][1] != null ? d.days[i][1].mins : 300;
                    int se = d.days[i][4] != null ? d.days[i][4].mins : 1200;
                    mn = (sr + se) / 2;
                }
                d.noonMins[i] = mn;
                d.dates[i] = day.optString("date", "");
                d.wd[i] = day.optString("wd", "");
                d.gd[i] = day.optString("gd", "");
                d.gm[i] = day.optString("gm", "");
                d.hd[i] = day.optString("hd", "");
                d.hm[i] = day.optString("hm", "");
                d.hy[i] = day.optString("hy", "");
                d.mp[i] = day.optString("mp", "");
                d.mi[i] = day.optInt("mi", 0);
            }
            d.decoded = n;
            pickToday(d);
            return d;
        } catch (Exception e) {
            return null;
        }
    }

    private static PrayTime[] parseTimes(JSONArray arr) {
        PrayTime[] out = new PrayTime[6];
        if (arr == null) return out;
        for (int i = 0; i < arr.length() && i < 6; i++) {
            JSONObject o = arr.optJSONObject(i);
            if (o == null) continue;
            PrayTime pt = new PrayTime();
            pt.name = o.optString("n", KEYS[i]);
            pt.mins = toMinutes(o.optString("t", "00:00"));
            out[i] = pt;
        }
        return out;
    }

    private static void pickToday(Data d) {
        String today = todayDateStr(d.tz);
        d.stale = false;
        if (d.decoded <= 0) { d.todayIndex = 0; return; }
        for (int i = 0; i < d.decoded; i++) {
            if (today.equals(d.dates[i])) { d.todayIndex = i; return; }
        }
        // Bugün yoksa: ilk ileri tarihi kullan (saat kayması), yoksa son günü kullan.
        // Son günü kullanmak "sessizce 1. güne dönüp 3 gün önceki vakti gösterme"
        // hatasını önler; bayat olduğu `stale` ile işaretlenir.
        for (int i = 0; i < d.decoded; i++) {
            if (d.dates[i] != null && d.dates[i].compareTo(today) > 0) {
                d.todayIndex = i;
                return;
            }
        }
        d.todayIndex = d.decoded - 1;
        d.stale = true;
    }

    public static PrayTime[] today(Data d) {
        if (d == null || d.todayIndex < 0 || d.todayIndex >= d.decoded
                || d.days[d.todayIndex] == null) return new PrayTime[6];
        return d.days[d.todayIndex];
    }
    public static PrayTime[] tomorrow(Data d) {
        int idx = d.todayIndex + 1;
        return idx >= 0 && idx < d.decoded && d.days[idx] != null ? d.days[idx] : null;
    }

    public static int toMinutes(String hhmm) {
        try {
            String[] p = hhmm.split(":");
            return Integer.parseInt(p[0].trim()) * 60 + Integer.parseInt(p[1].trim());
        } catch (Exception e) {
            return 0;
        }
    }

    public static int nowMins(String tz) {
        Calendar cal = GregorianCalendar.getInstance(TimeZone.getTimeZone(tz == null || tz.isEmpty() ? TimeZone.getDefault().getID() : tz));
        return cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
    }

    public static String todayDateStr(String tz) {
        Calendar cal = GregorianCalendar.getInstance(TimeZone.getTimeZone(tz == null || tz.isEmpty() ? TimeZone.getDefault().getID() : tz));
        return String.format("%04d-%02d-%02d", cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH));
    }

    private static TimeZone tzOf(Data d) {
        TimeZone t = TimeZone.getTimeZone(d.tz == null || d.tz.isEmpty() ? TimeZone.getDefault().getID() : d.tz);
        return t;
    }

    /** Sonraki vakit indeksi: bugün içindeki ilk geçmemiş vakit; yoksa 6 (yarının imsakı). */
    public static int nextIndex(Data d) {
        int now = nowMins(d.tz);
        PrayTime[] today = today(d);
        for (int i = 0; i < 6; i++) {
            PrayTime pt = today[i];
            if (pt == null) continue;
            if (pt.mins > now) return i;
        }
        return 6;
    }

    /** Sonraki vaktin adı (bugünün ya da yarının ilk vakti). Veri yoksa null. */
    public static PrayTime nextPrayer(Data d, int idx) {
        if (idx >= 0 && idx < 6 && today(d)[idx] != null) return today(d)[idx];
        PrayTime[] t = tomorrow(d);
        return t != null && t[0] != null ? t[0] : null;
    }

    /** Kalan süre (dakika): pozitif, sarmalı dikkate alır. */
    public static long remainingMinutes(Data d, int idx) {
        int now = nowMins(d.tz);
        if (idx >= 0 && idx < 6 && today(d)[idx] != null) {
            long r = today(d)[idx].mins - now;
            return r > 0 ? r : r + 1440;
        }
        PrayTime[] t = tomorrow(d);
        if (t == null || t[0] == null) return 0;
        long r = t[0].mins - now;
        return r > 0 ? r : r + 1440;
    }

    public static String fmtDur(long minutes) {
        long totalSec = Math.max(0, minutes * 60);
        long hh = totalSec / 3600;
        long mm = (totalSec % 3600) / 60;
        long ss = totalSec % 60;
        if (hh > 0) return String.format("%d:%02d:%02d", hh, mm, ss);
        return String.format("%02d:%02d", mm, ss);
    }

    public static String fmtTime(int mins) {
        return String.format("%02d:%02d", mins / 60, mins % 60);
    }

    // ---------------------------------------------------------------- tazeleme alarmları

    /**
     * Bugünkü 6 vakit + gece yarısı için exact alarm programlanır. Her alarm
     * WidgetRefreshReceiver'ı tetikler; receiver veriyi yeniden okuyup hem widget'ları
     * tazeler hem de sonraki alarmları yeniden kurar.
     */
    public static void scheduleRefreshAlarms(Context c) {
        Data d = loadData(c);
        if (d == null || d.decoded <= 0) return;
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            TimeZone tz = tzOf(d);
            long now = System.currentTimeMillis();
            boolean exact = canExact(am);

            // bugünkü 6 vakit
            PrayTime[] today = today(d);
            for (int i = 0; i < 6; i++) {
                PrayTime pt = today[i];
                if (pt == null) continue;
                long trig = triggerMs(d, tz, pt.mins);
                if (trig <= now) continue;
                setAlarm(am, exact, trig, alarmIntent(c, ALARM_REQ_BASE + i));
            }
            // gece yarısı (yarın 00:00) — yeni gün verilerine geçiş
            long midnight = triggerMs(d, tz, 1440);
            if (midnight > now) {
                setAlarm(am, exact, midnight, alarmIntent(c, ALARM_REQ_BASE + 6));
            }

            // Saat ve yay widget'ı her dakika tazelenir (canlı saat / ibre).
            // Sayısal ve kart widget'ları yalnızca vakit geçişlerinde güncellenir;
            // gereksiz dakika uyanmaları pili tüketmesin.
            PendingIntent tick = PendingIntent.getBroadcast(c, ALARM_REQ_CLOCK,
                    new Intent(ACTION_REFRESH).setPackage(c.getPackageName()),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            if (hasClockOrArc(c)) {
                long nowMs = System.currentTimeMillis();
                long nextMin = nowMs - (nowMs % 60000) + 60000;
                setAlarm(am, exact, nextMin, tick);
            } else {
                am.cancel(tick);
            }
        } catch (Exception ignored) {
            // AlarmManager erişimi kapalıysa sessiz geç; 30 dk updatePeriod yedek.
        }
    }

    /** Android 12+ exact alarm izni yoksa inexact alarmlara düşeriz; zincir kopmaz. */
    private static boolean canExact(AlarmManager am) {
        if (Build.VERSION.SDK_INT >= 31) {
            try {
                return am.canScheduleExactAlarms();
            } catch (Exception e) {
                return false;
            }
        }
        return true;
    }

    private static void setAlarm(AlarmManager am, boolean exact, long trigger, PendingIntent pi) {
        try {
            if (exact) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            } else {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            }
        } catch (SecurityException se) {
            try {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trigger, pi);
            } catch (Exception ignored) {
            }
        } catch (Exception ignored) {
            // tek alarm kurulamazsa diğerleri kurulmaya devam etsin
        }
    }

    /** Belirtilen widget sağlayıcısının launcher'da en az bir örneği var mı? */
    public static boolean hasAppWidgets(Context c, Class<?> provider) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(c);
        return mgr.getAppWidgetIds(new ComponentName(c, provider)).length > 0;
    }

    /** Canlı saati olan widget'lardan biri launcher'da yerleşik mi? (dakika tazelemesi) */
    public static boolean hasClockOrArc(Context c) {
        return hasAppWidgets(c, PrayerClockWidgetProvider.class)
                || hasAppWidgets(c, PrayerArcWidgetProvider.class)
                || hasAppWidgets(c, PrayerAnalogWidgetProvider.class);
    }

    public static PendingIntent alarmIntent(Context c, int reqCode) {
        Intent i = new Intent(ACTION_REFRESH).setPackage(c.getPackageName());
        return PendingIntent.getBroadcast(c, reqCode, i,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    /** Location-tz cinsinden bugünün belli bir dakikasının (veya 1440=yarın 00:00) cihaz epoch milisini verir. */
    private static long triggerMs(Data d, TimeZone tz, int minsOfDay) {
        Calendar cal = new GregorianCalendar(tz);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        if (minsOfDay == 1440) {
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.add(Calendar.DAY_OF_MONTH, 1);
        } else {
            cal.set(Calendar.HOUR_OF_DAY, minsOfDay / 60);
            cal.set(Calendar.MINUTE, minsOfDay % 60);
        }
        return cal.getTimeInMillis();
    }
}