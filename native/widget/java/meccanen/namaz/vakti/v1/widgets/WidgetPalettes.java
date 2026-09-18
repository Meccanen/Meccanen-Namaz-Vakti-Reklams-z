package meccanen.namaz.vakti.v1.widgets;

import meccanen.namaz.vakti.v1.R;

/**
 * Widget renk paletleri — uygulamanın 16 temasına birebir karşılık gelir.
 * Her tema: arka plan (bg), vurgu panel, ana/metin (text), soluk (muted), vurgu (accent).
 * Vakit renkleri koyu/açık tema ayrımına göre iki set halinde kullanılır
 * (açık temalarda kontrast için daha koyu tonlar).
 */
public final class WidgetPalettes {
    private WidgetPalettes() {}

    // 6 vakit sırası: İmsak, Güneş, Öğle, İkindi, Akşam, Yatsı
    static final int[] DARK_PRAYERS = {0xFF93C5FD, 0xFFFBBF24, 0xFFFDE047, 0xFF5EEAD4, 0xFFFB923C, 0xFFC084FC};
    static final int[] LIGHT_PRAYERS = {0xFF1D4ED8, 0xFFD97706, 0xFFA16207, 0xFF0F766E, 0xFFEA580C, 0xFF7E22CE};

    static final class Pal {
        int bg;      // widget kart arka planı
        int panel;   // vurgu zeminleri (highlight)
        int text;    // ana metin
        int muted;   // soluk metin
        int accent;  // sonraki vakit / vurgu
        boolean light;
    }

    static Pal get(String theme) {
        Pal p = new Pal();
        switch (theme == null ? "gece" : theme) {
            case "gece":          p.bg = 0xFF020617; p.panel = 0xFF1E293B; p.text = 0xFFF1F5F9; p.muted = 0xFF94A3B8; p.accent = 0xFF38BDF8; p.light = false; break;
            case "alacakaranlik": p.bg = 0xFF1A0A2E; p.panel = 0xFF3B2160; p.text = 0xFFF1F5F9; p.muted = 0xFFB3A6C9; p.accent = 0xFFE879F9; p.light = false; break;
            case "orman":         p.bg = 0xFF051A0F; p.panel = 0xFF14532D; p.text = 0xFFF1F5F9; p.muted = 0xFF86C8A8; p.accent = 0xFF34D399; p.light = false; break;
            case "altin":         p.bg = 0xFF160D00; p.panel = 0xFF452E08; p.text = 0xFFFDF3DC; p.muted = 0xFFD9B87F; p.accent = 0xFFFBBF24; p.light = false; break;
            case "ramazan":       p.bg = 0xFF0D0A1A; p.panel = 0xFF2E2166; p.text = 0xFFF1F5F9; p.muted = 0xFFA9A0C9; p.accent = 0xFFC084FC; p.light = false; break;
            case "kabe":          p.bg = 0xFF0A0A0A; p.panel = 0xFF262011; p.text = 0xFFF5F5F5; p.muted = 0xFFA8A29E; p.accent = 0xFFEAB308; p.light = false; break;
            case "turkuaz":       p.bg = 0xFF010F14; p.panel = 0xFF0E3B48; p.text = 0xFFEAF6FA; p.muted = 0xFF8AC0CE; p.accent = 0xFF22D3EE; p.light = false; break;
            case "bordo":         p.bg = 0xFF1A0008; p.panel = 0xFF4C1226; p.text = 0xFFFDF0F3; p.muted = 0xFFD9A8B4; p.accent = 0xFFFB7185; p.light = false; break;
            case "gunes":         p.bg = 0xFF1A0D00; p.panel = 0xFF4A2E10; p.text = 0xFFFDF3DD; p.muted = 0xFFDBB98C; p.accent = 0xFFFB923C; p.light = false; break;
            case "safir":         p.bg = 0xFF00051A; p.panel = 0xFF15275E; p.text = 0xFFF1F5F9; p.muted = 0xFF9AA8CC; p.accent = 0xFF60A5FA; p.light = false; break;
            case "seher":         p.bg = 0xFFFEFCE8; p.panel = 0xFFFDE68A; p.text = 0xFF451A03; p.muted = 0xFF92400E; p.accent = 0xFFB45309; p.light = true;  break;
            case "gul":           p.bg = 0xFFFFF1F2; p.panel = 0xFFFECDD3; p.text = 0xFF4C0519; p.muted = 0xFFBE123C; p.accent = 0xFFBE123C; p.light = true; break;
            case "nane":          p.bg = 0xFFF0FDF4; p.panel = 0xFFBBF7D0; p.text = 0xFF052E16; p.muted = 0xFF15803D; p.accent = 0xFF15803D; p.light = true; break;
            case "vaha":          p.bg = 0xFFE6FBF5; p.panel = 0xFF99F6E4; p.text = 0xFF042F2E; p.muted = 0xFF0F766E; p.accent = 0xFF3730A3; p.light = true; break;
            case "nilufer":       p.bg = 0xFFE6FBF5; p.panel = 0xFF99F6E4; p.text = 0xFF042F2E; p.muted = 0xFF0F766E; p.accent = 0xFFBE123C; p.light = true; break;
            case "lavanta":       p.bg = 0xFFF5F3FF; p.panel = 0xFFDDD6FE; p.text = 0xFF2E1065; p.muted = 0xFF6D28D9; p.accent = 0xFF6D28D9; p.light = true; break;
            default:              p.bg = 0xFF020617; p.panel = 0xFF1E293B; p.text = 0xFFF1F5F9; p.muted = 0xFF94A3B8; p.accent = 0xFF38BDF8; p.light = false; break;
        }
        return p;
    }

    static int[] prayers(Pal p) {
        return p.light ? LIGHT_PRAYERS : DARK_PRAYERS;
    }

    static int bgDrawableId(String theme) {
        switch (theme == null ? "gece" : theme) {
            case "gece":          return R.drawable.widget_bg_gece;
            case "alacakaranlik": return R.drawable.widget_bg_alacakaranlik;
            case "orman":         return R.drawable.widget_bg_orman;
            case "altin":         return R.drawable.widget_bg_altin;
            case "ramazan":       return R.drawable.widget_bg_ramazan;
            case "kabe":          return R.drawable.widget_bg_kabe;
            case "turkuaz":       return R.drawable.widget_bg_turkuaz;
            case "bordo":         return R.drawable.widget_bg_bordo;
            case "gunes":         return R.drawable.widget_bg_gunes;
            case "safir":         return R.drawable.widget_bg_safir;
            case "seher":         return R.drawable.widget_bg_seher;
            case "gul":           return R.drawable.widget_bg_gul;
            case "nane":          return R.drawable.widget_bg_nane;
            case "vaha":          return R.drawable.widget_bg_vaha;
            case "nilufer":       return R.drawable.widget_bg_nilufer;
            case "lavanta":       return R.drawable.widget_bg_lavanta;
            default:              return R.drawable.widget_bg_gece;
        }
    }
}