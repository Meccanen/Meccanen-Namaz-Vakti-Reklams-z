package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Büyük 4x4 saat/takvim widget'ı: ana uygulamadaki "saat + miladi/hicri takvim"
 * kartının birebir portu + altta altı vaktin adı ve saati. Canlı saat için
 * WidgetCore her dakika exact alarm kurar.
 */
public class PrayerClockWidgetProvider extends AppWidgetProvider {

    static final int ROOT     = R.id.widget_clock_root;
    static final int CITY     = R.id.widget_clock_city;
    static final int TIME     = R.id.widget_clock_time;
    static final int WEEKDAY  = R.id.widget_clock_weekday;
    static final int GLABEL   = R.id.widget_clock_glabel;
    static final int GDAY     = R.id.widget_clock_gday;
    static final int GMO      = R.id.widget_clock_gmo;
    static final int HLABEL   = R.id.widget_clock_hlabel;
    static final int HDAY     = R.id.widget_clock_hday;
    static final int HMO      = R.id.widget_clock_hmo;
    static final int[] LABELS = {
        R.id.widget_clock_l0, R.id.widget_clock_l1, R.id.widget_clock_l2,
        R.id.widget_clock_l3, R.id.widget_clock_l4, R.id.widget_clock_l5
    };
    static final int[] TIMES = {
        R.id.widget_clock_t0, R.id.widget_clock_t1, R.id.widget_clock_t2,
        R.id.widget_clock_t3, R.id.widget_clock_t4, R.id.widget_clock_t5
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetCore.refreshAll(context);
        // Widget eklendiğinde/launcher tazelediğinde günlük işin kurulu olduğundan emin ol.
        WidgetSyncWorker.schedule(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetCore.scheduleRefreshAlarms(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                          int appWidgetId, android.os.Bundle newOptions) {
        WidgetCore.refreshAll(context);
    }

    /** "Miladi"/"Hicri" etiketleri — uygulamanın i18n çevirileriyle birebir. */
    static String label(String lang, String key) {
        String l = lang == null ? "en" : lang;
        if (key.equals("gregorian")) {
            switch (l) {
                case "tr": return "Miladi";
                case "de": return "Gregorianisch";
                case "ar": return "ميلادي";
                case "ur": return "عیسوی";
                default:   return "Gregorian";
            }
        }
        switch (l) {
            case "tr": return "Hicri";
            case "de": return "Hijri";
            case "ar": return "هجري";
            case "ur": return "ہجری";
            default:   return "Hijri";
        }
    }

    static RemoteViews buildViews(Context c, int widgetId, WidgetCore.Data d) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_clock_layout);
        try {
            WidgetPalettes.Pal pal = WidgetPalettes.get(d == null ? "gece" : d.theme);
            v.setInt(ROOT, "setBackgroundResource", WidgetPalettes.bgDrawableId(d == null ? "gece" : d.theme));
            v.setTextColor(CITY, pal.accent);
            v.setTextColor(TIME, pal.text);
            v.setTextColor(WEEKDAY, pal.muted);
            v.setTextColor(GLABEL, pal.accent);
            v.setTextColor(HLABEL, pal.accent);

            if (d == null) {
                // veri henüz gelmedi — yer tutucu boş görünüm; hata olarak algılanmasın
                v.setTextViewText(TIME, "--:--");
                v.setTextViewText(WEEKDAY, "–");
                WidgetCore.setOpenAppClick(c, v, ROOT);
                return v;
            }
            int today = d.todayIndex;

            v.setTextViewText(CITY, safe(d.city));
            v.setTextViewText(TIME, WidgetCore.fmtTime(WidgetCore.nowMins(d.tz)));
            v.setTextViewText(WEEKDAY, safe(d.wd[today]));
            v.setTextColor(WEEKDAY, pal.accent);

            int idx = WidgetCore.nextIndex(d);

            v.setTextViewText(GLABEL, label(d.lang, "gregorian"));
            v.setTextViewText(GDAY, safe(d.gd[today]));
            v.setTextColor(GDAY, pal.accent);
            v.setTextViewText(GMO, safe(d.gm[today]));
            v.setTextColor(GMO, pal.accent);

            v.setTextViewText(HLABEL, label(d.lang, "hijri"));
            v.setTextViewText(HDAY, safe(d.hd[today]));
            v.setTextColor(HDAY, pal.accent);
            String hmo = safe(d.hm[today]);
            if (!hmo.isEmpty() && !safe(d.hy[today]).isEmpty()) hmo += " (" + d.hy[today] + ")";
            v.setTextViewText(HMO, hmo);
            v.setTextColor(HMO, pal.accent);

            WidgetCore.PrayTime[] todayTimes = WidgetCore.today(d);
            for (int i = 0; i < 6; i++) {
                WidgetCore.PrayTime pt = todayTimes[i];
                if (pt == null) continue;
                v.setTextViewText(LABELS[i], PrayerArcWidgetProvider.widgetName(pt.name, d.lang));
                v.setTextColor(LABELS[i], pal.accent);
                v.setTextViewText(TIMES[i], WidgetCore.fmtTime(pt.mins));
                v.setTextColor(TIMES[i], i == idx ? pal.accent : pal.text);
            }
        } catch (Exception ignored) {
            // herhangi bir çizim hatasında widget kullanıcıya boş göstermesin;
            // zaman bilgisiyle birlikte sağlam şekilde sunulmaya devam etsin
            try {
                v = new RemoteViews(c.getPackageName(), R.layout.widget_clock_layout);
                v.setTextViewText(TIME, WidgetCore.fmtTime(WidgetCore.nowMins(d == null ? "" : d.tz)));
            } catch (Exception ignored2) {
            }
        }
        WidgetCore.setOpenAppClick(c, v, ROOT);
        return v;
    }

    private static String safe(String s) { return s == null ? "" : s; }
}