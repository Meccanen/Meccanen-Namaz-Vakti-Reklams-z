package meccanen.namaz.vakti.v1.widgets;

import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.TimeZone;

import android.icu.text.DateFormatSymbols;
import android.icu.util.IslamicCalendar;
import android.icu.util.ULocale;

/**
 * Native widget payload üreticisi.
 *
 * Öncelik AlAdhan'ın aylık takvim uç noktasıdır (tek-üç istekte 30 gün). Ağ yoksa
 * veya kullanıcı "Matematiksel (Offline)" metodunu seçtiyse {@link PrayerMath} ile
 * aynı gün için vakitler hesaplanır. Böylece uygulama hiç açılmasa da widget'ın
 * elinde her zaman ileri tarihli veri olur.
 */
public final class WidgetPayloadBuilder {

    private static final String TAG = "WidgetPayloadBuilder";
    private static final String API = "https://api.aladhan.com/v1/calendar/";
    private static final String[] API_KEYS = {"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"};
    private static final double SYNODIC_MONTH = 29.53058867;
    private static final long KNOWN_NEW_MOON = 947182440000L; // 2000-01-06 18:14 UTC

    private static final Map<String, String[]> PRAYER_NAMES = new HashMap<>();
    private static final Map<String, String[]> MOON_NAMES = new HashMap<>();
    private static final Map<String, String[]> HIJRI_MONTHS = new HashMap<>();

    static {
        PRAYER_NAMES.put("tr", new String[]{"İmsak", "Güneş", "Öğle", "İkindi", "Akşam", "Yatsı"});
        PRAYER_NAMES.put("en", new String[]{"Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"});
        PRAYER_NAMES.put("ar", new String[]{"الفجر", "الشروق", "الظهر", "العصر", "المغرب", "العشاء"});
        PRAYER_NAMES.put("de", new String[]{"Fadschr", "Sonnenaufgang", "Dhuhr", "Asr", "Maghrib", "Isha"});
        PRAYER_NAMES.put("ur", new String[]{"فجر", "طلوع آفتاب", "ظہر", "عصر", "مغرب", "عشاء"});

        MOON_NAMES.put("tr", new String[]{"Yeni Ay", "Hilal", "İlk Dördün", "Şişkin Ay", "Dolunay", "Azalan Şişkin Ay", "Son Dördün", "Eski Hilal"});
        MOON_NAMES.put("en", new String[]{"New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Third Quarter", "Waning Crescent"});
        MOON_NAMES.put("ar", new String[]{"محاق", "هلال متزايد", "تربيع أول", "أحدب متزايد", "بدر", "أحدب متناقص", "تربيع ثاني", "هلال متناقص"});
        MOON_NAMES.put("de", new String[]{"Neumond", "Zunehmende Sichel", "Erstes Viertel", "Zunehmender Mond", "Vollmond", "Abnehmender Mond", "Letztes Viertel", "Abnehmende Sichel"});
        MOON_NAMES.put("ur", new String[]{"نیا چاند", "بڑھتا ہلال", "پہلی چوتھائی", "بڑھتا بھرا چاند", "پورا چاند", "گھٹتا بھرا چاند", "آخری چوتھائی", "گھٹتا ہلال"});

        // JS tarafındaki `HIJRI_MONTHS` ile birebir aynı adlar. Böylece native
        // worker'ın yazdığı ay adı ile uygulama açılınca JS'in yazdığı ad
        // arasında fark oluşmaz (ör. "Jumada I" / "Jumada al-Ula").
        HIJRI_MONTHS.put("tr", new String[]{"Muharrem", "Safer", "Rebiülevvel", "Rebiülahir", "Cemaziyelevvel", "Cemaziyelahir", "Recep", "Şaban", "Ramazan", "Şevval", "Zilkade", "Zilhicce"});
        HIJRI_MONTHS.put("en", new String[]{"Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Ula", "Jumada al-Thania", "Rajab", "Sha'ban", "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"});
        HIJRI_MONTHS.put("ar", new String[]{"محرم", "صفر", "ربيع الأول", "ربيع الثاني", "جمادى الأولى", "جمادى الآخرة", "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة"});
        HIJRI_MONTHS.put("de", new String[]{"Muharram", "Safar", "Rabi al-Awwal", "Rabi ath-Thani", "Dschumada l-ula", "Dschumada th-thaniya", "Radschab", "Scha'ban", "Ramadan", "Schawwal", "Dhu l-Qa'da", "Dhu l-Hijja"});
        HIJRI_MONTHS.put("ur", new String[]{"محرم", "صفر", "ربیع الاول", "ربیع الثانی", "جمادی الاول", "جمادی الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذوالقعدہ", "ذوالحجہ"});
    }

    private WidgetPayloadBuilder() {}

    /**
     * Eski payload'daki şehir/tema/dil/konum/metot ayarlarını koruyarak ileri tarihli
     * yeni bir payload üretir. Konum yoksa null döner (worker yapacak bir şey bulamaz).
     */
    public static JSONObject build(JSONObject cfg, int horizonDays) {
        try {
            double lat = cfg.optDouble("lat", Double.NaN);
            double lng = cfg.optDouble("lng", Double.NaN);
            if (Double.isNaN(lat) || Double.isNaN(lng)) return null;

            int method = cfg.optInt("method", 13);
            String tzId = cfg.optString("tz", "Europe/Istanbul");
            if (tzId.isEmpty()) tzId = "Europe/Istanbul";
            TimeZone tz = TimeZone.getTimeZone(tzId);
            String lang = cfg.optString("lang", "en");
            Locale locale = localeFor(lang);
            ULocale uLocale = ULocale.forLocale(locale);

            int horizon = Math.max(1, Math.min(horizonDays, WidgetCore.MAX_DAYS));

            Map<String, JSONObject> api = null;
            if (method != 99) {
                try {
                    api = fetchWindow(lat, lng, method, tz, horizon);
                } catch (Exception e) {
                    Log.w(TAG, "AlAdhan erişilemedi, offline hesap kullanılacak: " + e.getMessage());
                }
            }

            Calendar day = new GregorianCalendar(tz);
            day.set(Calendar.HOUR_OF_DAY, 12);
            day.set(Calendar.MINUTE, 0);
            day.set(Calendar.SECOND, 0);
            day.set(Calendar.MILLISECOND, 0);

            JSONArray days = new JSONArray();
            for (int i = 0; i < horizon; i++) {
                String iso = String.format(Locale.US, "%04d-%02d-%02d",
                        day.get(Calendar.YEAR), day.get(Calendar.MONTH) + 1, day.get(Calendar.DAY_OF_MONTH));
                PrayerMath.Result calc = PrayerMath.compute(lat, lng, day, tz);
                JSONObject timings = api == null ? null : api.get(iso);

                JSONObject o = new JSONObject();
                o.put("date", iso);
                o.put("noon", PrayerMath.fmt(calc.solarNoon));
                o.put("wd", format(day, tz, locale, "EEEE"));
                o.put("gd", format(day, tz, locale, "d"));
                o.put("gm", format(day, tz, locale, "MMMM yyyy"));
                fillHijri(o, day, tz, uLocale, lang);

                long moonAge = day.getTimeInMillis();
                int[] moon = moonPhase(moonAge);
                o.put("mp", moonName(lang, moon[0]));
                o.put("mi", moon[1]);

                String[] names = prayerNames(lang);
                JSONArray times = new JSONArray();
                for (int k = 0; k < 6; k++) {
                    String t = "";
                    if (timings != null) t = cleanTime(timings.optString(API_KEYS[k], ""));
                    if (t.isEmpty()) t = PrayerMath.fmt(calc.mins[k]);
                    JSONObject p = new JSONObject();
                    p.put("n", names[k]);
                    p.put("t", t);
                    times.put(p);
                }
                o.put("times", times);
                days.put(o);
                day.add(Calendar.DAY_OF_MONTH, 1);
            }

            JSONObject out = new JSONObject();
            out.put("days", days);
            out.put("city", cfg.optString("city", ""));
            out.put("theme", cfg.optString("theme", "gece"));
            out.put("lang", lang);
            out.put("tz", tzId);
            out.put("lat", lat);
            out.put("lng", lng);
            out.put("method", method);
            out.put("updated", System.currentTimeMillis() / 1000);
            return out;
        } catch (Exception e) {
            Log.e(TAG, "payload üretilemedi", e);
            return null;
        }
    }

    // ------------------------------------------------------------------ AlAdhan

    private static Map<String, JSONObject> fetchWindow(double lat, double lng, int method,
                                                       TimeZone tz, int horizonDays) throws Exception {
        Calendar start = new GregorianCalendar(tz);
        start.set(Calendar.HOUR_OF_DAY, 12);
        start.set(Calendar.MINUTE, 0);
        start.set(Calendar.SECOND, 0);
        start.set(Calendar.MILLISECOND, 0);

        Calendar end = (Calendar) start.clone();
        end.add(Calendar.DAY_OF_MONTH, horizonDays - 1);

        Set<String> months = new LinkedHashSet<>();
        Calendar cursor = (Calendar) start.clone();
        while (!cursor.after(end)) {
            months.add(cursor.get(Calendar.YEAR) + "-" + (cursor.get(Calendar.MONTH) + 1));
            cursor.add(Calendar.DAY_OF_MONTH, 1);
        }

        Map<String, JSONObject> out = new HashMap<>();
        for (String key : months) {
            String[] p = key.split("-");
            JSONArray data = fetchMonth(lat, lng, method,
                    Integer.parseInt(p[0]), Integer.parseInt(p[1]));
            for (int i = 0; i < data.length(); i++) {
                JSONObject day = data.optJSONObject(i);
                if (day == null) continue;
                JSONObject date = day.optJSONObject("date");
                JSONObject greg = date == null ? null : date.optJSONObject("gregorian");
                String iso = greg == null ? null : isoFromDmy(greg.optString("date", ""));
                JSONObject timings = day.optJSONObject("timings");
                if (iso != null && timings != null) out.put(iso, timings);
            }
        }
        return out;
    }

    private static JSONArray fetchMonth(double lat, double lng, int method, int year, int month) throws Exception {
        String url = API + year + "/" + month
                + "?latitude=" + lat + "&longitude=" + lng + "&method=" + method;
        HttpURLConnection conn = null;
        try {
            conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(20000);
            conn.setRequestProperty("Accept", "application/json");
            conn.setRequestProperty("User-Agent", "MeccanenWidget/1.0");
            int code = conn.getResponseCode();
            if (code != 200) throw new IOException("HTTP " + code);
            String body = read(conn.getInputStream());
            JSONObject root = new JSONObject(body);
            if (root.optInt("code", 0) != 200) {
                throw new IOException("API " + root.optString("status", "?"));
            }
            JSONArray data = root.optJSONArray("data");
            if (data == null) throw new IOException("veri yok");
            return data;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String read(InputStream in) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(in, "UTF-8"));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line);
        reader.close();
        return sb.toString();
    }

    private static String isoFromDmy(String dmy) {
        String[] p = dmy == null ? new String[0] : dmy.split("-");
        if (p.length != 3) return null;
        return p[2] + "-" + p[1] + "-" + p[0];
    }

    /** AlAdhan aylık uç noktası "06:04 (+03)" biçiminde dönebilir; sadece HH:MM'i al. */
    private static String cleanTime(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        int space = s.indexOf(' ');
        if (space > 0) s = s.substring(0, space).trim();
        if (!s.matches("\\d{1,2}:\\d{2}")) return "";
        return s;
    }

    // ------------------------------------------------------------------ yerelleştirme

    private static Locale localeFor(String lang) {
        switch (lang == null ? "en" : lang) {
            case "tr": return Locale.forLanguageTag("tr-TR");
            case "ar": return Locale.forLanguageTag("ar-SA");
            case "de": return Locale.forLanguageTag("de-DE");
            case "ur": return Locale.forLanguageTag("ur-PK");
            default: return Locale.forLanguageTag("en-US");
        }
    }

    private static String[] prayerNames(String lang) {
        String[] n = PRAYER_NAMES.get(lang);
        return n != null ? n : PRAYER_NAMES.get("en");
    }

    private static String moonName(String lang, int idx) {
        String[] n = MOON_NAMES.get(lang);
        if (n == null) n = MOON_NAMES.get("en");
        return n[Math.max(0, Math.min(7, idx))];
    }

    private static String hijriMonthName(String lang, int idx) {
        String[] n = HIJRI_MONTHS.get(lang);
        if (n == null) n = HIJRI_MONTHS.get("en");
        return n[Math.max(0, Math.min(11, idx))];
    }

    /** Miladi alanları her zaman Gregoryen takvimle biçimlendirir (ar-SA dahil). */
    private static String format(Calendar day, TimeZone tz, Locale locale, String pattern) {
        SimpleDateFormat f = new SimpleDateFormat(pattern, locale);
        f.setCalendar(new GregorianCalendar(tz, locale));
        return f.format(day.getTime());
    }

    /** Hicri tarih: Umm al-Qura, JS'deki `islamic-umalqura` ile aynı aile. */
    private static void fillHijri(JSONObject out, Calendar day, TimeZone tz, ULocale uLocale, String lang) {
        try {
            android.icu.util.TimeZone icuTz = android.icu.util.TimeZone.getTimeZone(tz.getID());
            IslamicCalendar hcal = new IslamicCalendar(icuTz, uLocale);
            hcal.setCalculationType(IslamicCalendar.CalculationType.ISLAMIC_UMALQURA);
            hcal.setTimeInMillis(day.getTimeInMillis());

            int monthIdx = hcal.get(android.icu.util.Calendar.MONTH);
            out.put("hd", String.valueOf(hcal.get(android.icu.util.Calendar.DAY_OF_MONTH)));
            out.put("hy", String.valueOf(hcal.get(android.icu.util.Calendar.YEAR)));
            // Ay ADI, ay indeksinden ve JS ile aynı açık listeden gelir.
            // (Eskiden SimpleDateFormat kullanılıyordu; ay indeksi hicri,
            // adı ise Gregoryen tablodan geliyordu → "Kasım" hatası.)
            out.put("hm", hijriMonthName(lang, monthIdx));
        } catch (Exception e) {
            try {
                out.put("hd", "--");
                out.put("hm", "--");
                out.put("hy", "----");
            } catch (Exception ignored) {
                // JSONObject zaten boşsa alanlar eksik kalır
            }
        }
    }

    /** [faz indeksi 0..7, aydınlanma %] */
    private static int[] moonPhase(long timeMillis) {
        double days = (timeMillis - KNOWN_NEW_MOON) / 86_400_000.0;
        double age = ((days % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
        double illumination = 0.5 * (1 - Math.cos((age / SYNODIC_MONTH) * 2 * Math.PI));
        int idx = (int) (Math.round((age / SYNODIC_MONTH) * 8) % 8);
        return new int[]{idx, (int) Math.round(illumination * 100)};
    }
}
