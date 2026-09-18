package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.os.Bundle;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Sematik yay widget: 6 vakit renkli çeyrek halka + hareketli ibre + merkez sonraki vakt bilgisi.
 * Tüm 24 saat tam daire olarak çizilir; her dilim bir sonraki vakte kadar olan süreyi temsil eder.
 */
public class PrayerArcWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetCore.refreshAll(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager,
                                          int appWidgetId, Bundle newOptions) {
        WidgetCore.refreshAll(context);
    }

    static RemoteViews buildViews(Context c, int widgetId, WidgetCore.Data d) {
        if (d == null) return null;
        WidgetCore.PrayTime[] today = WidgetCore.today(d);
        if (today[0] == null) return null;

        WidgetPalettes.Pal pal = WidgetPalettes.get(d.theme);
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_arc_layout);
        v.setInt(R.id.widget_arc_root, "setBackgroundResource", WidgetPalettes.bgDrawableId(d.theme));

        int idx = WidgetCore.nextIndex(d);
        String dur = WidgetCore.fmtDur(WidgetCore.remainingMinutes(d, idx));
        WidgetCore.PrayTime np = WidgetCore.nextPrayer(d, idx);
        if (np == null) return null;

        v.setTextViewText(R.id.widget_arc_next, np.name);
        v.setTextColor(R.id.widget_arc_next, pal.accent);
        v.setTextViewText(R.id.widget_arc_detail, WidgetCore.fmtTime(np.mins) + " · " + dur);
        v.setTextColor(R.id.widget_arc_detail, pal.text);

        Bitmap bmp = buildArcBitmap(d, pal, idx);
        v.setImageViewBitmap(R.id.widget_arc_image, bmp);
        return v;
    }

    private static Bitmap buildArcBitmap(WidgetCore.Data d, WidgetPalettes.Pal pal, int nextIdx) {
        int size = 512;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        canvas.drawColor(Color.TRANSPARENT);

        float cx = size / 2f, cy = size / 2f;
        float radius = size * 0.32f;
        float stroke  = size * 0.14f;

        float[] starts = new float[6];
        float[] sweeps = new float[6];
        computeArcs(d, starts, sweeps);

        int[] prayerColors = WidgetPalettes.prayers(pal);

        // arka plan halkası
        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setStyle(Paint.Style.STROKE);
        bgPaint.setStrokeWidth(stroke);
        bgPaint.setColor(pal.panel);
        RectF oval = new RectF(cx - radius, cy - radius, cx + radius, cy + radius);
        canvas.drawArc(oval, 0, 360, false, bgPaint);

        // renkli dilimler
        Paint segPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        segPaint.setStyle(Paint.Style.STROKE);
        segPaint.setStrokeWidth(stroke);
        segPaint.setStrokeCap(Paint.Cap.BUTT);
        RectF inner = new RectF(cx - radius, cy - radius, cx + radius, cy + radius);

        for (int i = 0; i < 6; i++) {
            segPaint.setColor(prayerColors[i]);
            canvas.drawArc(inner, starts[i], sweeps[i], false, segPaint);
        }

        // ibre
        float nowAng = angleDeg(d, d.tz);
        drawNeedle(canvas, cx, cy, radius - stroke / 2f - 2, nowAng, pal.accent);

        // dilation labels around ring
        drawLabels(canvas, d, starts, sweeps, cx, cy, radius + stroke / 2f + size * 0.08f, pal, nextIdx, size * 0.045f);

        return bmp;
    }

    private static void computeArcs(WidgetCore.Data d, float[] starts, float[] sweeps) {
        int[] mins = new int[7]; // 6 today + tomorrow imsak for wrap
        for (int i = 0; i < 6; i++) {
            WidgetCore.PrayTime pt = WidgetCore.today(d)[i];
            mins[i] = pt != null ? pt.mins : i * 240;
        }
        WidgetCore.PrayTime tom = WidgetCore.tomorrow(d)[0];
        mins[6] = tom != null ? tom.mins : 1440;

        for (int i = 0; i < 6; i++) {
            starts[i] = -90f + (mins[i] / 1440f) * 360f;
            int next = (i < 5) ? mins[i + 1] : mins[6];
            sweeps[i] = ((next - mins[i] + 1440) % 1440) / 1440f * 360f;
            if (sweeps[i] < 1f) sweeps[i] = 1f; // görünür kalsın
        }
    }

    private static float angleDeg(WidgetCore.Data d, String tz) {
        int now = WidgetCore.nowMins(tz);
        return -90f + (now / 1440f) * 360f;
    }

    private static void drawNeedle(Canvas canvas, float cx, float cy, float length, float angleDeg, int color) {
        float rad = (float) Math.toRadians(angleDeg);
        float ex = cx + (float) Math.cos(rad) * length;
        float ey = cy + (float) Math.sin(rad) * length;

        Paint np = new Paint(Paint.ANTI_ALIAS_FLAG);
        np.setColor(color);
        np.setStrokeWidth(5f);
        np.setStrokeCap(Paint.Cap.ROUND);
        canvas.drawLine(cx, cy, ex, ey, np);
        canvas.drawCircle(ex, ey, 6f, np);
        canvas.drawCircle(cx, cy, 4f, np);
    }

    private static void drawLabels(Canvas canvas, WidgetCore.Data d,
                                   float[] starts, float[] sweeps,
                                   float cx, float cy, float textRadius,
                                   WidgetPalettes.Pal pal, int nextIdx, float textSize) {
        Paint tp = new Paint(Paint.ANTI_ALIAS_FLAG);
        tp.setTextSize(textSize);
        tp.setTextAlign(Paint.Align.CENTER);

        WidgetCore.PrayTime[] today = WidgetCore.today(d);
        for (int i = 0; i < 6; i++) {
            WidgetCore.PrayTime pt = today[i];
            if (pt == null) continue;
            float mid = (float) Math.toRadians(starts[i] + sweeps[i] / 2f);
            float tx = cx + (float) Math.cos(mid) * textRadius;
            float ty = cy + (float) Math.sin(mid) * textRadius;
            tp.setColor(i == nextIdx ? pal.accent : pal.muted);
            canvas.drawText(pt.name, tx, ty + textSize / 3f, tp);
        }
    }
}