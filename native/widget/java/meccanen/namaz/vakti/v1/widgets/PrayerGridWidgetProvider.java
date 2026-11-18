package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.util.Log;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Vakit Kartları widget'ı (kompakt): sol-üst konum, 6 başlık kartı (İmsak..Yatsı)
 * ve her kartın altında ortalanmış vakitler. Tasarım ilk (sayısal) widget'ın
 * verisini kullanır ama görsel düzeni farklıdır.
 */
public class PrayerGridWidgetProvider extends AppWidgetProvider {

    static final String TAG = "PrayerGridWidget";

    static final int ROOT      = R.id.widget_grid_root;
    static final int CITY      = R.id.widget_grid_city;

    static final int[] CARDS = {
            R.id.widget_grid_c0, R.id.widget_grid_c1, R.id.widget_grid_c2,
            R.id.widget_grid_c3, R.id.widget_grid_c4, R.id.widget_grid_c5
    };

    static final int[] LABELS = {
            R.id.widget_grid_l0, R.id.widget_grid_l1, R.id.widget_grid_l2,
            R.id.widget_grid_l3, R.id.widget_grid_l4, R.id.widget_grid_l5
    };
    static final int[] TIMES = {
            R.id.widget_grid_t0, R.id.widget_grid_t1, R.id.widget_grid_t2,
            R.id.widget_grid_t3, R.id.widget_grid_t4, R.id.widget_grid_t5
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

    static RemoteViews buildViews(Context c, int widgetId, WidgetCore.Data d) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_grid_layout);
        try {
            WidgetPalettes.Pal pal = WidgetPalettes.get(d == null ? "gece" : d.theme);
            v.setInt(ROOT, "setBackgroundResource", WidgetPalettes.bgDrawableId(d == null ? "gece" : d.theme));
            for (int i = 0; i < 6; i++) {
                v.setInt(CARDS[i], "setBackgroundResource", R.drawable.widget_grid_card);
                v.setTextColor(LABELS[i], pal.accent);
                v.setTextColor(TIMES[i], pal.text);
            }
            v.setTextColor(CITY, pal.muted);

            if (d == null) { WidgetCore.setOpenAppClick(c, v, ROOT, CARDS); return v; } // veri henüz yok — yer tutucularla görün

            v.setTextViewText(CITY, d.city);

            int idx = WidgetCore.nextIndex(d);

            WidgetCore.PrayTime[] today = WidgetCore.today(d);
            boolean nextMarked = false;
            for (int i = 0; i < 6; i++) {
                WidgetCore.PrayTime pt = today[i];
                if (pt == null) continue;
                v.setTextViewText(LABELS[i], pt.name);
                v.setTextViewText(TIMES[i], WidgetCore.fmtTime(pt.mins));
                if (!nextMarked && i == idx) {
                    v.setTextColor(TIMES[i], pal.accent);
                    nextMarked = true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "buildViews hatasi widgetId=" + widgetId, e);
            // hata anında da boş görünüm sunulsun — asla null dönme
        }
        WidgetCore.setOpenAppClick(c, v, ROOT, CARDS);
        return v;
    }
}