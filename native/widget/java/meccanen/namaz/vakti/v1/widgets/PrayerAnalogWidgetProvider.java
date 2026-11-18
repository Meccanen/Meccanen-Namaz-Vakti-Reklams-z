package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Typeface;
import android.os.Bundle;
import android.widget.RemoteViews;

import java.util.Calendar;
import java.util.GregorianCalendar;
import java.util.TimeZone;

import meccanen.namaz.vakti.v1.R;

/**
 * Analog saat widget'ı: temalı analog kadran (akrep + yelkovan) ve üstünde
 * saniyede bir kare değiştiren hareketli saniye ibresi; altta diğer
 * widget'lardaki 6 sütunlu iki satır namaz vakti. Saniye ibresi bir ViewFlipper
 * ile launcher içinde akar; uygulama her saniye uyanmaz. Güncelleme zinciri
 * (dakika alarmları + günlük WidgetSyncWorker) diğer widget'larla aynıdır.
 */
public class PrayerAnalogWidgetProvider extends AppWidgetProvider {

    static final int ROOT    = R.id.widget_analog_root;
    static final int CITY    = R.id.widget_analog_city;
    static final int IMAGE   = R.id.widget_analog_image;
    static final int FLIPPER = R.id.widget_analog_seconds_flipper;

    static final int[] LABELS = {
        R.id.widget_analog_l0, R.id.widget_analog_l1, R.id.widget_analog_l2,
        R.id.widget_analog_l3, R.id.widget_analog_l4, R.id.widget_analog_l5
    };
    static final int[] TIMES = {
        R.id.widget_analog_t0, R.id.widget_analog_t1, R.id.widget_analog_t2,
        R.id.widget_analog_t3, R.id.widget_analog_t4, R.id.widget_analog_t5
    };

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetCore.refreshAll(context);
        WidgetSyncWorker.schedule(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetCore.scheduleRefreshAlarms(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                          int appWidgetId, Bundle newOptions) {
        WidgetCore.refreshAll(context);
    }

    static RemoteViews buildViews(Context c, int widgetId, WidgetCore.Data d) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_analog_layout);
        try {
            WidgetPalettes.Pal pal = WidgetPalettes.get(d == null ? "gece" : d.theme);
            v.setInt(ROOT, "setBackgroundResource", WidgetPalettes.bgDrawableId(d == null ? "gece" : d.theme));
            v.setTextColor(CITY, pal.accent);
            for (int i = 0; i < 6; i++) {
                v.setTextColor(LABELS[i], pal.accent);
                v.setTextColor(TIMES[i], pal.text);
            }

            Calendar cal = nowCalendar(d == null ? "" : d.tz);
            v.setImageViewBitmap(IMAGE, buildClockFace(pal, cal));

            // Hareketli saniye ibresi: 60 kareli ViewFlipper launcher içinde her
            // saniye bir sonraki kareye geçer. Şimdiki saniyeye hizala; böylece
            // widget yeniden çizilse bile ibre doğru konumdan devam eder.
            v.setInt(FLIPPER, "setDisplayedChild", cal.get(Calendar.SECOND));

            if (d == null) {
                v.setTextViewText(CITY, "—");
                WidgetCore.setOpenAppClick(c, v, ROOT);
                return v;
            }

            int today = d.todayIndex;
            String city = d.city == null || d.city.trim().isEmpty() ? "—" : d.city.trim();
            v.setTextViewText(CITY, city);

            int idx = WidgetCore.nextIndex(d);
            WidgetCore.PrayTime[] times = WidgetCore.today(d);
            for (int i = 0; i < 6; i++) {
                WidgetCore.PrayTime pt = times[i];
                if (pt == null) continue;
                v.setTextViewText(LABELS[i], PrayerArcWidgetProvider.widgetName(pt.name, d.lang));
                v.setTextColor(LABELS[i], pal.accent);
                v.setTextViewText(TIMES[i], WidgetCore.fmtTime(pt.mins));
                v.setTextColor(TIMES[i], i == idx ? pal.accent : pal.text);
            }
        } catch (Exception ignored) {
            try {
                v = new RemoteViews(c.getPackageName(), R.layout.widget_analog_layout);
                v.setTextViewText(CITY, "—");
            } catch (Exception ignored2) {
            }
        }
        WidgetCore.setOpenAppClick(c, v, ROOT);
        return v;
    }

    private static Calendar nowCalendar(String tz) {
        TimeZone z = TimeZone.getTimeZone(
                tz == null || tz.isEmpty() ? TimeZone.getDefault().getID() : tz);
        return GregorianCalendar.getInstance(z);
    }

    /** Temalı analog kadran: dış çember, 60 çentik, 12/3/6/9, akrep ve yelkovan. */
    private static Bitmap buildClockFace(WidgetPalettes.Pal pal, Calendar cal) {
        int size = 512;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        canvas.drawColor(Color.TRANSPARENT);
        float cx = size / 2f, cy = size / 2f;
        float r = size * 0.43f;
        Paint p = new Paint(Paint.ANTI_ALIAS_FLAG);

        // kadran zemini
        p.setStyle(Paint.Style.FILL);
        p.setColor(pal.panel);
        p.setAlpha(pal.light ? 0x1A : 0x2E);
        canvas.drawCircle(cx, cy, r, p);

        // dış çember
        p.setStyle(Paint.Style.STROKE);
        p.setStrokeWidth(size * 0.018f);
        p.setColor(pal.panel);
        p.setAlpha(0xFF);
        canvas.drawCircle(cx, cy, r, p);

        // saat/dakika çentikleri
        for (int i = 0; i < 60; i++) {
            boolean hour = i % 5 == 0;
            float a = (float) Math.toRadians(-90 + i * 6);
            float ca = (float) Math.cos(a), sa = (float) Math.sin(a);
            float outer = r - size * 0.012f;
            float len = hour ? size * 0.050f : size * 0.024f;
            p.setColor(hour ? pal.text : pal.muted);
            p.setAlpha(hour ? 0xFF : 0x99);
            p.setStrokeWidth(hour ? size * 0.011f : size * 0.005f);
            canvas.drawLine(cx + outer * ca, cy + outer * sa,
                    cx + (outer - len) * ca, cy + (outer - len) * sa, p);
        }

        // 12 / 3 / 6 / 9
        Paint np = new Paint(Paint.ANTI_ALIAS_FLAG);
        np.setTextSize(size * 0.065f);
        np.setTextAlign(Paint.Align.CENTER);
        np.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        np.setColor(pal.muted);
        String[] nums = {"12", "3", "6", "9"};
        float nr = r * 0.74f;
        for (int i = 0; i < 4; i++) {
            float a = (float) Math.toRadians(-90 + i * 90);
            float x = cx + nr * (float) Math.cos(a);
            float y = cy + nr * (float) Math.sin(a) + np.getTextSize() * 0.34f;
            canvas.drawText(nums[i], x, y, np);
        }

        // akrep + yelkovan
        int hh = cal.get(Calendar.HOUR_OF_DAY) % 12;
        int mm = cal.get(Calendar.MINUTE);
        float hourAng = (float) Math.toRadians(-90 + (hh + mm / 60f) * 30f);
        float minAng = (float) Math.toRadians(-90 + mm * 6f);

        Paint hand = new Paint(Paint.ANTI_ALIAS_FLAG);
        hand.setStyle(Paint.Style.STROKE);
        hand.setStrokeCap(Paint.Cap.ROUND);
        hand.setColor(pal.text);
        hand.setStrokeWidth(size * 0.030f);
        canvas.drawLine(cx, cy,
                cx + r * 0.48f * (float) Math.cos(hourAng),
                cy + r * 0.48f * (float) Math.sin(hourAng), hand);

        hand.setStrokeWidth(size * 0.020f);
        canvas.drawLine(cx, cy,
                cx + r * 0.72f * (float) Math.cos(minAng),
                cy + r * 0.72f * (float) Math.sin(minAng), hand);

        // merkez noktası
        p.setStyle(Paint.Style.FILL);
        p.setColor(pal.accent);
        p.setAlpha(0xFF);
        canvas.drawCircle(cx, cy, size * 0.022f, p);
        return bmp;
    }
}