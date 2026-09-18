package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Sayısal 4x2 widget: günün 6 vakti + sonraki vakte kalan süre.
 */
public class PrayerTimesWidgetProvider extends AppWidgetProvider {

    static final int ROOT = R.id.widget_pt_root;
    static final int CITY = R.id.widget_pt_city;
    static final int NEXT = R.id.widget_pt_next;

    static final int[] LABELS = {
            R.id.widget_pt_l0, R.id.widget_pt_l1, R.id.widget_pt_l2,
            R.id.widget_pt_l3, R.id.widget_pt_l4, R.id.widget_pt_l5
    };
    static final int[] TIMES = {
            R.id.widget_pt_t0, R.id.widget_pt_t1, R.id.widget_pt_t2,
            R.id.widget_pt_t3, R.id.widget_pt_t4, R.id.widget_pt_t5
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetCore.refreshAll(context);
    }

    static RemoteViews buildViews(Context c, int widgetId, WidgetCore.Data d) {
        if (d == null) return null;
        WidgetCore.PrayTime[] today = WidgetCore.today(d);
        if (today[0] == null) return null;

        WidgetPalettes.Pal pal = WidgetPalettes.get(d.theme);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_pt_layout);
        v.setInt(ROOT, "setBackgroundResource", WidgetPalettes.bgDrawableId(d.theme));

        v.setTextViewText(CITY, d.city);
        v.setTextColor(CITY, pal.muted);

        int idx = WidgetCore.nextIndex(d);
        String dur = WidgetCore.fmtDur(WidgetCore.remainingMinutes(d, idx));
        WidgetCore.PrayTime np = WidgetCore.nextPrayer(d, idx);
        if (np == null) return null;
        v.setTextViewText(NEXT, dur + " · " + np.name);
        v.setTextColor(NEXT, pal.accent);

        for (int i = 0; i < 6; i++) {
            WidgetCore.PrayTime pt = today[i];
            if (pt == null) continue;
            v.setTextViewText(LABELS[i], pt.name);
            v.setTextColor(LABELS[i], pal.muted);
            v.setTextViewText(TIMES[i], WidgetCore.fmtTime(pt.mins));
            if (i == idx) {
                v.setTextColor(TIMES[i], pal.accent);
            } else {
                v.setTextColor(TIMES[i], pal.text);
            }
        }
        return v;
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                          int appWidgetId, android.os.Bundle newOptions) {
        WidgetCore.refreshAll(context);
    }
}