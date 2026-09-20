package meccanen.namaz.vakti.v1.widgets;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.os.Bundle;
import android.widget.RemoteViews;

import meccanen.namaz.vakti.v1.R;

/**
 * Sematik yay widget: tam gün halkasında 6 vakti ayrık RENKLİ DİLİM olarak çizer
 * (her biri bir sonraki vakte kadar) + güneş doğumu/istiva/güneş batışı kerahat
 * bantları kırmızı bindirmeyle + SAAT ETİKETLERİ vakit geçiş noktalarında (tam
 * sınırda) + vakit adları dilimin içinde. Güneş dilimi kerahat bitişiyle sınırlıdır;
 * kalan sabah aralığı soluk tonla gösterilir (dev "güneş" bölümü yok).
 */
public class PrayerArcWidgetProvider extends AppWidgetProvider {

    private static final int KERAHAT_WINDOW_MIN = 45;
    // Sağdan-sola diller (ar/ur): gün doğudan doğduğu için imsak sağda, ilerleme sağdan sola.
    // Soldan-sağa diller (tr/en/de): İngilizce orijinali gibi soldan başlar, sağa ilerler.
    private static boolean RTL;

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
        v.setTextViewText(R.id.widget_arc_detail, WidgetCore.fmtTime(np.mins));
        v.setTextColor(R.id.widget_arc_detail, pal.text);
        v.setTextViewText(R.id.widget_arc_remaining, dur);
        v.setTextColor(R.id.widget_arc_remaining, pal.accent);

        Bitmap bmp = buildArcBitmap(d, pal, idx);
        v.setImageViewBitmap(R.id.widget_arc_image, bmp);
        return v;
    }

    private static Bitmap buildArcBitmap(WidgetCore.Data d, WidgetPalettes.Pal pal, int nextIdx) {
        RTL = d.lang != null && ("ar".equals(d.lang) || "ur".equals(d.lang));
        int size = 512;
        Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bmp);
        canvas.drawColor(Color.TRANSPARENT);

        WidgetCore.PrayTime[] t = WidgetCore.today(d);
        int[] mins = new int[6];
        for (int i = 0; i < 6; i++) mins[i] = t[i] != null ? t[i].mins : 0;
        int t6 = mins[0] + 1440; // ertesi gün imsakı — halka bununla sarar
        int nowMin = WidgetCore.nowMins(d.tz);

        float cx = size / 2f, cy = size / 2f;
        float radius = size * 0.30f;
        float stroke = size * 0.13f;
        float innerR = radius - stroke / 2f;
        float outerR = radius + stroke / 2f;
        int[] prayerColors = WidgetPalettes.prayers(pal);

        // ---- 1) ARKA PLAN halka (tam daire).
        Paint ringP = new Paint(Paint.ANTI_ALIAS_FLAG);
        ringP.setStyle(Paint.Style.STROKE);
        ringP.setStrokeWidth(stroke);
        ringP.setStrokeCap(Paint.Cap.BUTT);
        ringP.setColor(pal.panel);
        canvas.drawCircle(cx, cy, radius, ringP);

        // ---- 2) AYRIK VAKİT DİLİMLERİ (renkli halka yayları, sonraki vakte kadar).
        // Güneş dilimi kerahat bitişiyle sınırlanır; kalan sabah aralığı soluk tondur.
        int gunesEnd = mins[1] + KERAHAT_WINDOW_MIN;
        for (int i = 0; i < 6; i++) {
            int a = mins[i];
            int b = (i < 5) ? mins[i + 1] : t6;
            int c = Math.min(b, gunesEnd);
            if (c > a) {
                ringP.setColor(prayerColors[i]);
                ringBand(canvas, ringP, cx, cy, radius, ang(a), ang(c));
            }
            if (i == 1 && b > gunesEnd) {
                int f = (prayerColors[i] & 0x00FFFFFF) | 0x2E000000; // soluk güneş tonu
                ringP.setColor(f);
                ringBand(canvas, ringP, cx, cy, radius, ang(gunesEnd), ang(b));
            }
        }

        // ---- 3) KERAHAT BANTLARI: güneş doğuşu / istiva / güneş batışı.
        int[][] kerahat = {
            { mins[1], mins[1] + KERAHAT_WINDOW_MIN },
            { mins[2] - 5, mins[2] + 5 },
            { mins[4] - KERAHAT_WINDOW_MIN, mins[4] },
        };
        boolean inKerahat = false;
        for (int[] kb : kerahat) {
            if (nowMin >= kb[0] && nowMin <= kb[1]) inKerahat = true;
            float a1 = ang(kb[0]), a2 = ang(kb[1]);

            // yarı saydam kırmızı dilim (merkezden dış yaya) — segmentlerin üstünde.
            Paint wedgeP = new Paint(Paint.ANTI_ALIAS_FLAG);
            wedgeP.setStyle(Paint.Style.FILL);
            wedgeP.setColor((pal.light ? 0x3A : 0x4D) << 24 | 0x00000000 | (0xFFB91C1C & 0x00FFFFFF));
            canvas.drawPath(wedgePath(cx, cy, outerR, a1, a2), wedgeP);

            // halka üzerinde kırmızı şerit.
            Paint kbP = new Paint(Paint.ANTI_ALIAS_FLAG);
            kbP.setStyle(Paint.Style.STROKE);
            kbP.setStrokeWidth(stroke * 0.55f);
            kbP.setStrokeCap(Paint.Cap.BUTT);
            kbP.setColor((pal.light ? 0xC8 : 0xE6) << 24 | 0xC8 << 16 | 0x1C << 8 | 0x1C);
            ringBand(canvas, kbP, cx, cy, radius, a1, a2);
        }

        // ---- 4) GEÇİŞ NOKTALARI: tik + TAM VAKİT SAATİ (sınırda, belirgin).
        Paint tickP = new Paint(Paint.ANTI_ALIAS_FLAG);
        tickP.setColor(pal.text);
        tickP.setStrokeWidth(size * 0.006f);
        Paint timeP = new Paint(Paint.ANTI_ALIAS_FLAG);
        timeP.setTextSize(size * 0.044f);
        timeP.setTextAlign(Paint.Align.CENTER);
        timeP.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        timeP.setColor(pal.text);
        float tickIn = radius - stroke / 2f + 2f;
        float tickOut = radius + stroke / 2f + size * 0.018f;
        float timeR = radius + stroke / 2f + size * 0.052f;
        for (int i = 0; i < 6; i++) {
            float a = ang(mins[i]);
            canvas.drawLine(
                cx + tickIn * cosDeg(a), cy - tickIn * sinDeg(a),
                cx + tickOut * cosDeg(a), cy - tickOut * sinDeg(a), tickP);
            float tx = cx + timeR * cosDeg(a);
            float ty = cy - timeR * sinDeg(a);
            timeP.setColor(i == nextIdx ? pal.accent : pal.text);
            canvas.drawText(WidgetCore.fmtTime(mins[i]), tx, ty + size * 0.016f, timeP);
        }

        // ---- 5) VAKİT ADLARI (dilim içinde, iç halka kenarında).
        Paint nameP = new Paint(Paint.ANTI_ALIAS_FLAG);
        nameP.setTextSize(size * 0.045f);
        nameP.setTextAlign(Paint.Align.CENTER);
        nameP.setTypeface(Typeface.create(Typeface.DEFAULT, Typeface.BOLD));
        float nameR = innerR - size * 0.016f;
        for (int i = 0; i < 6; i++) {
            int mid = i == 1 ? mins[1] + KERAHAT_WINDOW_MIN / 2
                             : (mins[i] + ((i < 5) ? mins[i + 1] : t6)) / 2;
            float a = ang(mid);
            float nx = cx + nameR * cosDeg(a);
            float ny = cy - nameR * sinDeg(a);
            nameP.setColor(i == nextIdx ? pal.accent : pal.text);
            canvas.drawText(t[i].name, nx, ny + size * 0.012f, nameP);
        }

        // ---- 6) İBRE — kerahat bandındayken kırmızı.
        int needleColor = inKerahat ? 0xFFDC2626 : pal.accent;
        float a = ang(Math.max(-120, Math.min(nowMin, t6)));
        float len = innerR - 6f;
        float tx = cx + len * cosDeg(a);
        float ty = cy - len * sinDeg(a);
        Paint needle = new Paint(Paint.ANTI_ALIAS_FLAG);
        needle.setColor(needleColor);
        needle.setStrokeWidth(size * 0.012f);
        needle.setStrokeCap(Paint.Cap.ROUND);
        canvas.drawLine(cx, cy, tx, ty, needle);
        canvas.drawCircle(tx, ty, size * 0.045f, needle);
        canvas.drawCircle(cx, cy, size * 0.014f, needle);

        return bmp;
    }

    /** Dakikayı tam daire açısına çevirir (yukarı-düzlem: -90=üst/12:00). İlerleme yönü dilin
     *  RTL/LTR olmasına göre: ar/ur → saat yönü (imsak sağda, batıya doğru); tr/en/de → ters. */
    private static float ang(int t) {
        int m = t % 1440;
        return RTL ? -90f + m * 0.25f : 270f - m * 0.25f;
    }

    /** Halka yayı çizer (a1→a2 derece, butt cap; tam segmented vurgusu için path). */
    private static void ringBand(Canvas canvas, Paint p, float cx, float cy, float r, float a1, float a2) {
        Path path = new Path();
        int steps = Math.max(2, (int) Math.abs(a2 - a1));
        for (int k = 0; k <= steps; k++) {
            float a = a1 + (a2 - a1) * k / steps;
            if (k == 0) path.moveTo(cx + r * cosDeg(a), cy - r * sinDeg(a));
            else path.lineTo(cx + r * cosDeg(a), cy - r * sinDeg(a));
        }
        canvas.drawPath(path, p);
    }

    /** Merkezden dış yaya giden yarı saydam kerahat dilimi. */
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