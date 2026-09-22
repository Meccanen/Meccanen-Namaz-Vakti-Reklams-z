package meccanen.namaz.vakti.v1.widgets;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

/**
 * Widget'ların ortak beyni: JS'den gelen JSON payload'ı saklar, o anki vakte/şimdiki
 * vakte göre "sonraki vakit" + kalan süreyi hesaplar, her vakit geçişinde ve gece
 * yarısında widget'ları tazelemek için exact alarmlar programlar.
 *
 * Payload şeması (JS `widgetBridge`'den):
 * {
 *   "days": [ { "date":"2026-09-18", "times":[ {"n":"İmsak","t":"04:49"}, ... 6 ] }, x3 ],
 *   "city": "Istanbul, Türkiye",
 *   "theme": "gece",
 *   "lang": "tr",
 *   "tz": "Europe/Istanbul"
 * }
 */
public final class WidgetCore {

    private WidgetCore() {}

    public static final String PREFS       = "mpw_prefs";
    public static final String KEY_PAYLOAD = "payload";
    public static final String ACTION_REFRESH = "meccanen.namaz.vakti.v1.widgets.REFRESH";
    public static final int ALARM_REQ_BASE = 7100;

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
        public final PrayTime[][] days = new PrayTime[3][6];
        public final int[] noonMins = new int[3]; // her günün istiva/zeval dakikası
        // Saat/takvim widget'ı için gün bazlı yerelleştirilmiş alanlar (JS'den gelir).
        public final String[] wd = new String[3]; // haftanın günü
        public final String[] gd = new String[3]; // miladi gün
        public final String[] gm = new String[3]; // miladi ay + yıl
        public final String[] hd = new String[3]; // hicri gün
        public final String[] hm = new String[3]; // hicri ay
        public final String[] hy = new String[3]; // hicri yıl
        public final String[] mp = new String[3]; // ay fazı
        public final int[] mi = new int[3];       // ay aydınlanma %
        public int todayIndex = 0;   // bugünle eşleşen gün (0..2)
        public int decoded = 0;      // kaç gün başarıyla çözüldü
    }

    public static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    public static String savedPayload(Context c) {
        return prefs(c).getString(KEY_PAYLOAD, null);
    }

    /** Payload'ı sakla, alarmları programla ve widget'ları anında tazele. */
    public static void saveAndUpdate(Context c, String payload) {
        prefs(c).edit().putString(KEY_PAYLOAD, payload).apply();
        refreshAll(c);
        scheduleRefreshAlarms(c);
    }

    public static void refreshAll(Context c) {
        Data d = loadData(c);
        if (d == null) return;
        AppWidgetManager mgr = AppWidgetManager.getInstance(c);
        updateProvider(c, mgr, PrayerTimesWidgetProvider.class, d);
        updateProvider(c, mgr, PrayerArcWidgetProvider.class, d);
        updateProvider(c, mgr, PrayerClockWidgetProvider.class, d);
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
        if (provider == PrayerTimesWidgetProvider.class) return PrayerTimesWidgetProvider.buildViews(c, id, d);
        if (provider == PrayerClockWidgetProvider.class) return PrayerClockWidgetProvider.buildViews(c, id, d);
        if (provider == PrayerGridWidgetProvider.class) return PrayerGridWidgetProvider.buildViews(c, id, d);
        return PrayerArcWidgetProvider.buildViews(c, id, d);
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
            int n = Math.min(days.length(), 3);
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
        for (int i = 0; i < d.decoded; i++) {
            String date = d.raw.optJSONArray("days").optJSONObject(i).optString("date", "");
            if (date.equals(today)) { d.todayIndex = i; return; }
        }
        d.todayIndex = 0;
    }

    public static PrayTime[] today(Data d) { return d.days[d.todayIndex]; }
    public static PrayTime[] tomorrow(Data d) {
        int idx = Math.min(d.todayIndex + 1, d.decoded - 1);
        return d.days[idx];
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

    /** Sonraki vakit indeksi: bugün içindeki ilk geçmemiş vakit; yoksa 0 (yarına sarar). */
    public static int nextIndex(Data d) {
        int now = nowMins(d.tz);
        PrayTime[] today = today(d);
        for (int i = 0; i < 6; i++) {
            PrayTime pt = today[i];
            if (pt == null) continue;
            if (pt.mins > now) return i;
        }
        return 0;
    }

    /** Sonraki vaktin adı (bugünün ya da yarının ilk vakti). */
    public static PrayTime nextPrayer(Data d, int idx) {
        if (idx < 6 && today(d)[idx] != null) return today(d)[idx];
        return tomorrow(d)[0];
    }

    /** Kalan süre (dakika): pozitif, sarmalı dikkate alır. */
    public static long remainingMinutes(Data d, int idx) {
        int now = nowMins(d.tz);
        if (idx < 6 && today(d)[idx] != null) {
            long r = today(d)[idx].mins - now;
            return r > 0 ? r : r + 1440;
        }
        long r = tomorrow(d)[0].mins - now;
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
        if (d == null) return;
        try {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            TimeZone tz = tzOf(d);
            long now = System.currentTimeMillis();

            // bugünkü 6 vakit
            for (int i = 0; i < 6; i++) {
                PrayTime pt = today(d)[i];
                if (pt == null) continue;
                long trig = triggerMs(d, tz, pt.mins);
                if (trig <= now) continue;
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, trig, alarmIntent(c, ALARM_REQ_BASE + i));
            }
            // gece yarısı (yarın 00:00) — yeni gün verilerine geçiş
            long midnight = triggerMs(d, tz, 1440);
            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, midnight, alarmIntent(c, ALARM_REQ_BASE + 6));

            // Büyük saat widget'ı yerleşikse HER DAKİKA tazele (canlı saat). Saat widget'ı
            // launcher'dan kaldırılınca alarm iptal edilir (pil dostu).
            PendingIntent tick = PendingIntent.getBroadcast(c, ALARM_REQ_CLOCK,
                    new Intent(ACTION_REFRESH).setPackage(c.getPackageName()),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            if (hasAppWidgets(c, PrayerClockWidgetProvider.class)) {
                long nowMs = System.currentTimeMillis();
                long nextMin = nowMs - (nowMs % 60000) + 60000;
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextMin, tick);
            } else {
                am.cancel(tick);
            }
        } catch (Exception ignored) {
            // exact izni yoksa sessiz geç; widget 30 dk / boot ile yenilenir
        }
    }

    /** Belirtilen widget sağlayıcısının launcher'da en az bir örneği var mı? */
    public static boolean hasAppWidgets(Context c, Class<?> provider) {
        AppWidgetManager mgr = AppWidgetManager.getInstance(c);
        return mgr.getAppWidgetIds(new ComponentName(c, provider)).length > 0;
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