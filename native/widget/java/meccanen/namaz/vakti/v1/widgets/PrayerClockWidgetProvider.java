package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Büyük 4x6 saat/takvim widget'ı: ana uygulamadaki "saat + miladi/hicri takvim"
 * kartının birebir portu. Canlı saat için WidgetCore her dakika exact alarm kurar.
 */
public class PrayerClockWidgetProvider extends AppWidgetProvider {

    static final int ROOT     = R.id.widget_clock_root;
    static final int CITY     = R.id.widget_clock_city;
    static final int TIME     = R.id.widget_clock_time;
    static final int WEEKDAY  = R.id.widget_clock_weekday;
    static final int NEXT     = R.id.widget_clock_next;
    static final int GLABEL   = R.id.widget_clock_glabel;
    static final int GDAY     = R.id.widget_clock_gday;
    static final int GMO      = R.id.widget_clock_gmo;
    static final int HLABEL   = R.id.widget_clock_hlabel;
    static final int HDAY     = R.id.widget_clock_hday;
    static final int HMO      = R.id.widget_clock_hmo;
    static final int MOON     = R.id.widget_clock_moon;

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetCore.refreshAll(context);
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
        if (d == null) return null;
        int today = d.todayIndex;

        WidgetPalettes.Pal pal = WidgetPalettes.get(d.theme);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_clock_layout);
        v.setInt(ROOT, "setBackgroundResource", WidgetPalettes.bgDrawableId(d.theme));

        v.setTextViewText(CITY, d.city);
        v.setTextColor(CITY, pal.muted);

        v.setTextViewText(TIME, WidgetCore.fmtTime(WidgetCore.nowMins(d.tz)));
        v.setTextColor(TIME, pal.text);

        v.setTextViewText(WEEKDAY, d.wd[today]);
        v.setTextColor(WEEKDAY, pal.muted);

        int idx = WidgetCore.nextIndex(d);
        String dur = PrayerTimesWidgetProvider.fmtDurHuman(WidgetCore.remainingMinutes(d, idx), d.lang);
        WidgetCore.PrayTime np = WidgetCore.nextPrayer(d, idx);
        if (np != null) {
            v.setTextViewText(NEXT, np.name + " · " + dur);
            v.setTextColor(NEXT, pal.accent);
        }

        v.setTextViewText(GLABEL, label(d.lang, "gregorian"));
        v.setTextColor(GLABEL, pal.accent);
        v.setTextViewText(GDAY, d.gd[today]);
        v.setTextColor(GDAY, pal.text);
        v.setTextViewText(GMO, d.gm[today]);
        v.setTextColor(GMO, pal.muted);

        v.setTextViewText(HLABEL, label(d.lang, "hijri"));
        v.setTextColor(HLABEL, pal.accent);
        v.setTextViewText(HDAY, d.hd[today]);
        v.setTextColor(HDAY, pal.accent);
        String hmo = d.hm[today];
        if (!hmo.isEmpty() && !d.hy[today].isEmpty()) hmo += " (" + d.hy[today] + " AH)";
        v.setTextViewText(HMO, hmo);
        v.setTextColor(HMO, pal.accent);
        v.setTextViewText(MOON, d.mp[today] + " · %" + d.mi[today]);
        v.setTextColor(MOON, pal.muted);
        return v;
    }
}