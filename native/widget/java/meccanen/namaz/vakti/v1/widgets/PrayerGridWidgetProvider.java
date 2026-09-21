package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Vakit Kartları widget'ı (kompakt): sol-üst konum, sağ-üst sonraki vakte kalan
 * süre, 6 başlık kartı (İmsak..Yatsı) ve her kartın altında ortalanmış vakitler.
 * Tasarım ilk (sayısal) widget'ın verisini kullanır ama görsel düzeni farklıdır.
 */
public class PrayerGridWidgetProvider extends AppWidgetProvider {

    static final int ROOT      = R.id.widget_grid_root;
    static final int CITY      = R.id.widget_grid_city;
    static final int REMAINING = R.id.widget_grid_remaining;

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
            v.setTextColor(CITY, pal.muted);
            v.setTextColor(REMAINING, pal.accent);
            for (int i = 0; i < 6; i++) {
                v.setTextColor(LABELS[i], pal.accent);
                v.setTextColor(TIMES[i], pal.text);
            }

            if (d == null) return v; // veri henüz yok — yer tutucularla görün

            v.setTextViewText(CITY, d.city);

            int idx = WidgetCore.nextIndex(d);
            String dur = PrayerTimesWidgetProvider.fmtDurHuman(WidgetCore.remainingMinutes(d, idx), d.lang);
            WidgetCore.PrayTime np = WidgetCore.nextPrayer(d, idx);
            v.setTextViewText(REMAINING, np == null ? "–" : dur);

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
        } catch (Exception ignored) {
            // hata anında da boş görünüm sunulsun — asla null dönme
        }
        return v;
    }
}