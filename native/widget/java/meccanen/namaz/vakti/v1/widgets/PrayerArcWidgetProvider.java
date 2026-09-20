package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Typeface;
import android.os.Bundle;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Sematik yay widget: güneş doğuşundan batışına 180°'lik yay üzerinde, in-app
 * kerahat şemasıyla birebir aynı hesapla 3 kerahat bandı (güneş doğuşu kerahatı,
 * istiva/zeval, güneş batışı kerahatı) + 6 vakit işareti ve saat etiketleri +
 * istiva saati + hareketli ibre. Konum adı RemoteViews TextView'ı ile gösterilir.
 * Gündüz renkli bölümleri kerahat bantlarıyla sınırlıdır — güneş doğumu bölümü
 * dev bir dilim değil, yalnızca kerahat penceresidir.
 */
public class PrayerArcWidgetProvider extends AppWidgetProvider {

    private static final int KERAHAT_SUNRISE_MIN = 45;
    private static final int KERAHAT_NOON_WINDOW = 5;
    private static final int KERAHAT_SUNSET_MIN = 45;

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

        String city = d.city == null || d.city.trim().isEmpty() ? "—" : d.city.trim();
        v.setTextViewText(R.id.widget_arc_city, city);
        v.setTextColor(R.id.widget_arc_city, pal.accent);

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

        WidgetCore.PrayTime[] today = WidgetCore.today(d);
        int sunriseMin = today[1] != null ? today[1].mins : 6 * 60;
        int sunsetMin = today[4] != null ? today[4].mins : 19 * 60;
        int noonMin = d.noonMins[d.todayIndex] > 0 ? d.noonMins[d.todayIndex] : (sunriseMin + sunsetMin) / 2;
        int daylight = Math.max(60, sunsetMin - sunriseMin);

        float cx = size / 2f, cy = size * 0.60f;
        float radius = size * 0.30f;
        float stroke = size * 0.075f;
        float outerR = radius + stroke / 2f;

        int kerahat = pal.light ? 0xFFB91C1C : 0xFFF87171;
        int fillA = pal.light ? 0x40 : 0x55;
        int kerahatFill = (fillA << 24) | (kerahat & 0x00FFFFFF);
        int nowMin = WidgetCore.nowMins(d.tz);

        // Düzlem yardımcıları — in-app hesabı birebir: açı 0=batış(sağ), 90=istiva(üst),
        // 180=doğuş(sol). Nokta: x = cx + rr*cos(a), y = cy - rr*sin(a).

        // ---- ARKA PLAN: base halka (üst 180°). Canvas y-aşağı: 180°=sol, 90°=üst, 0°=sağ.
        Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        bgPaint.setStyle(Paint.Style.STROKE);
        bgPaint.setStrokeWidth(stroke);
        bgPaint.setColor(pal.panel);
        bgPaint.setStrokeCap(Paint.Cap.BUTT);
        RectF oval = new RectF(cx - radius, cy - radius, cx + radius, cy + radius);
        canvas.drawArc(oval, 180f, -180f, false, bgPaint);

        // ---- KERAHAT BANTLARI: merkezden dış yaya taralı görünümlü dolgu dilimleri.
        // in-app belirleyiciler: [sunrise, sunrise+45], [noon-5, noon+5], [sunset-45, sunset].
        int[][] bands = {
            { sunriseMin, sunriseMin + KERAHAT_SUNRISE_MIN },
            { noonMin - KERAHAT_NOON_WINDOW, noonMin + KERAHAT_NOON_WINDOW },
            { sunsetMin - KERAHAT_SUNSET_MIN, sunsetMin },
        };
        Paint fillP = new Paint(Paint.ANTI_ALIAS_FLAG);
        fillP.setStyle(Paint.Style.FILL);
        Paint edgeP = new Paint(Paint.ANTI_ALIAS_FLAG);
        edgeP.setStyle(Paint.Style.STROKE);
        edgeP.setStrokeWidth(size * 0.0045f);
        edgeP.setColor(kerahat);
        for (int b = 0; b < bands.length; b++) {
            float a1 = minToAngle(bands[b][0], sunriseMin, daylight);
            float a2 = minToAngle(bands[b][1], sunriseMin, daylight);
            boolean active = nowMin >= bands[b][0] && nowMin <= bands[b][1];
            fillP.setColor(active ? 0x9A000000 | (kerahat & 0x00FFFFFF) : kerahatFill);
            canvas.drawPath(wedgePath(cx, cy, outerR, a1, a2), fillP);
            canvas.drawPath(wedgePath(cx, cy, outerR, a1, a2), edgeP);
        }

        // ---- 6 VAKİT İŞARETİ (renkli nokta) + saat/etiket.
        int[] prayerColors = WidgetPalettes.prayers(pal);
        WidgetCore.PrayTime[] t = today;
        int[] mins = new int[6];
        for (int i = 0; i < 6; i++) mins[i] = t[i] != null ? t[i].mins : 0;

        Paint dotP = new Paint(Paint.ANTI_ALIAS_FLAG);
        dotP.setStyle(Paint.Style.FILL);
        float dotR = stroke * 0.42f + 2f;

        // Etiket konumları (kendi açılarına yayılır; imsak/yatsı yay dışında).
        // slot açılarımız bizim yukarı-düzlemde (0=sağ,90=üst,180=sol), 36° aralıkla.
        int[] labAng = { 192, 150, 108, 72, 30, -12 };
        float labelR = radius + stroke / 2f + size * 0.10f;

        Paint nameP = new Paint(Paint.ANTI_ALIAS_FLAG);
        nameP.setTextSize(size * 0.042f);
        nameP.setTextAlign(Paint.Align.CENTER);
        nameP.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        Paint timeP = new Paint(Paint.ANTI_ALIAS_FLAG);
        timeP.setTextSize(size * 0.032f);
        timeP.setTextAlign(Paint.Align.CENTER);
        Paint leadP = new Paint(Paint.ANTI_ALIAS_FLAG);
        leadP.setStyle(Paint.Style.STROKE);
        leadP.setStrokeWidth(size * 0.003f);
        leadP.setColor(pal.muted);
        leadP.setAlpha(pal.light ? 60 : 80);

        for (int i = 0; i < 6; i++) {
            if (mins[i] <= 0) continue;
            int targetMin = mins[i];
            // imsak/batsılar yay dışında kalsın diye uçları hafifçe dışına taşır.
            float ringAng;
            if (i == 0) ringAng = 185f;
            else if (i == 5) ringAng = -5f;
            else ringAng = minToAngle(targetMin, sunriseMin, daylight);

            // nokta (halka orta çizgisi üzerinde)
            float dx = cx + radius * cosDeg(ringAng);
            float dy = cy - radius * sinDeg(ringAng);
            dotP.setColor(i == nextIdx ? pal.accent : prayerColors[i]);
            canvas.drawCircle(dx, dy, i == nextIdx ? dotR + 4f : dotR, dotP);

            // etiket
            float la = (float) Math.toRadians(labAng[i]);
            float lx = cx + labelR * (float) Math.cos(la);
            float ly = cy - labelR * (float) Math.sin(la);
            canvas.drawLine(dx, dy, lx, ly, leadP);

            nameP.setColor(i == nextIdx ? pal.accent : pal.text);
            canvas.drawText(t[i].name, lx, ly, nameP);
            timeP.setColor(pal.muted);
            canvas.drawText(WidgetCore.fmtTime(mins[i]), lx, ly + size * 0.048f, timeP);
        }

        // ---- İSTİVA ZAMANI (üstte, kerahat renginde).
        Paint noonP = new Paint(Paint.ANTI_ALIAS_FLAG);
        noonP.setTextSize(size * 0.036f);
        noonP.setTextAlign(Paint.Align.CENTER);
        noonP.setColor(kerahat);
        noonP.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        canvas.drawText(WidgetCore.fmtTime(noonMin), cx, cy - radius - stroke / 2f - size * 0.012f, noonP);

        // ---- İBRE (yalnızca gündüz; kerahat bandındaysa kırmızı).
        boolean isDaytime = nowMin >= sunriseMin - 5 && nowMin <= sunsetMin + 5;
        if (isDaytime) {
            boolean inBand = (nowMin >= bands[0][0] && nowMin <= bands[0][1])
                    || (nowMin >= bands[1][0] && nowMin <= bands[1][1])
                    || (nowMin >= bands[2][0] && nowMin <= bands[2][1]);
            float a = minToAngle(nowMin, sunriseMin, daylight);
            float len = radius - stroke / 2f - 2f;
            float tx = cx + len * cosDeg(a);
            float ty = cy - len * sinDeg(a);
            Paint needle = new Paint(Paint.ANTI_ALIAS_FLAG);
            needle.setColor(inBand ? kerahat : pal.accent);
            needle.setStrokeWidth(size * 0.01f);
            needle.setStrokeCap(Paint.Cap.ROUND);
            canvas.drawLine(cx, cy, tx, ty, needle);
            canvas.drawCircle(tx, ty, size * 0.042f, needle);
            canvas.drawCircle(cx, cy, size * 0.012f, needle);
        }

        return bmp;
    }

    /** İn-app minToAngle birebir: yayın dışına düşen dakikalar uçlara kenetlenir. */
    private static float minToAngle(int m, int sunriseMin, int daylight) {
        float frac = (m - sunriseMin) / (float) daylight;
        if (frac <= 0f) return 180f;
        if (frac >= 1f) return 0f;
        return 180f * (1f - frac);
    }

    /** Merkezden dış yaya giden dolgu dilimi (yukarı-düzlem: 0=sağ,90=üst,180=sol). */
    private static Path wedgePath(float cx, float cy, float outerR, float a1, float a2) {
        Path p = new Path();
        p.moveTo(cx, cy);
        int steps = Math.max(2, (int) Math.abs(a2 - a1));
        for (int k = 0; k <= steps; k++) {
            float a = a1 + (a2 - a1) * k / steps;
            p.lineTo(cx + outerR * cosDeg(a), cy - outerR * sinDeg(a));
        }
        p.close();
        return p;
    }

    private static float cosDeg(float a) { return (float) Math.cos(Math.toRadians(a)); }
    private static float sinDeg(float a) { return (float) Math.sin(Math.toRadians(a)); }
}