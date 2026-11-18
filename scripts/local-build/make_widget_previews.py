#!/usr/bin/env python3
"""Widget seçici (picker) görsellerini üretir.

Android 12+ `previewLayout` kullanır; daha eski sürümler `previewImage` ister.
Bu betik ikisi için de statik PNG'leri üretir:

  native/widget/res/drawable-nodpi/       -> İngilizce (varsayılan)
  native/widget/res/drawable-tr-nodpi/    -> Türkçe
  native/widget/res/drawable-nodpi/widget_arc_ring.png -> dilsiz halka

Gereksinim: Pillow. Çalıştırma: python3 scripts/local-build/make_widget_previews.py
"""
import math
import os

from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RES = os.path.join(ROOT, "native", "widget", "res")

SCALE = 3  # px / dp
BG = (2, 6, 23, 255)
BORDER = (30, 41, 59, 255)
TEXT = (241, 245, 249, 255)
MUTED = (148, 163, 184, 255)
ACCENT = (56, 189, 248, 255)
PANEL = (30, 41, 59, 255)
CARD_FILL = (255, 255, 255, 15)
CARD_BORDER = (255, 255, 255, 26)
DIVIDER = (255, 255, 255, 34)
PRAYERS = [
    (147, 197, 253, 255),  # imsak
    (251, 191, 36, 255),   # güneş
    (253, 224, 71, 255),   # öğle
    (94, 234, 212, 255),   # ikindi
    (251, 146, 60, 255),   # akşam
    (192, 132, 252, 255),  # yatsı
]
KERAHAT = (220, 38, 38, 255)

FONT_REG = "/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf"

TIMES = [342, 428, 776, 948, 1122, 1212]  # 05:42 07:08 12:56 15:48 18:42 20:12
NEXT_INDEX = 4


def px(dp):
    return int(round(dp * SCALE))


def font(size_sp, bold=True, mono=False):
    path = FONT_MONO if mono else (FONT_BOLD if bold else FONT_REG)
    return ImageFont.truetype(path, int(round(size_sp * SCALE)))


def card(w, h):
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    d.rounded_rectangle(
        [0, 0, w - 1, h - 1],
        radius=px(28),
        fill=BG,
        outline=BORDER,
        width=max(1, px(1)),
    )
    return img, d


def fmt_time(mins):
    return "%02d:%02d" % (mins // 60, mins % 60)


def divider(d, x1, y, x2, width=1):
    d.rectangle([x1, y, x2, y + max(1, px(width)) - 1], fill=DIVIDER)


def text(d, xy, s, f, fill, anchor="lm"):
    d.text(xy, s, font=f, fill=fill, anchor=anchor)


# --------------------------------------------------------------------------- halka

def _ang(mins):
    return 270.0 - mins * 0.25


def _segment(d, cx, cy, r_out, r_in, a1, a2, fill):
    steps = max(12, int(abs(a2 - a1) * 2))
    pts = []
    for k in range(steps + 1):
        a = math.radians(a1 + (a2 - a1) * k / steps)
        pts.append((cx + r_out * math.cos(a), cy - r_out * math.sin(a)))
    for k in range(steps, -1, -1):
        a = math.radians(a1 + (a2 - a1) * k / steps)
        pts.append((cx + r_in * math.cos(a), cy - r_in * math.sin(a)))
    d.polygon(pts, fill=fill)


def make_ring(size=1024):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    cx = cy = size / 2.0
    # Saat etiketleri halkanın dış kenarında: halka kareye sığacak boyutta.
    radius = size * 0.30
    stroke = size * 0.13
    inner = radius - stroke / 2.0
    outer = radius + stroke / 2.0
    now = 17 * 60 + 20

    # arka plan halkası
    _segment(d, cx, cy, outer, inner, 0, 360, PANEL)

    gunes_end = TIMES[1] + 45
    for i in range(6):
        a = TIMES[i]
        b = TIMES[i + 1] if i < 5 else TIMES[0] + 1440
        c = min(b, gunes_end) if i == 1 else b
        if c > a:
            _segment(d, cx, cy, outer, inner, _ang(a), _ang(c), PRAYERS[i])
        if i == 1 and b > gunes_end:
            faded = PRAYERS[1][:3] + (60,)
            _segment(d, cx, cy, outer, inner, _ang(gunes_end), _ang(b), faded)

    # kerahat bantları
    for k1, k2 in ((TIMES[1], TIMES[1] + 45),
                   (TIMES[2] - 5, TIMES[2] + 5),
                   (TIMES[4] - 45, TIMES[4])):
        a1, a2 = _ang(k1), _ang(k2)
        _segment(d, cx, cy, outer, inner, a1, a2, (220, 38, 38, 210))

    # geçiş çentikleri ve halka saat etiketleri
    tick = ImageFont.truetype(FONT_BOLD, int(size * 0.040))
    tick_w = max(2, int(size * 0.006))
    time_r = radius + stroke / 2 + size * 0.052
    tick_in = radius - stroke / 2 + 2
    tick_out = radius + stroke / 2 + size * 0.018
    for i, mins in enumerate(TIMES):
        a = math.radians(_ang(mins))
        ca, sa = math.cos(a), math.sin(a)
        d.line(
            [(cx + tick_in * ca, cy - tick_in * sa),
             (cx + tick_out * ca, cy - tick_out * sa)],
            fill=TEXT,
            width=tick_w,
        )
        label = fmt_time(mins)
        half_w = tick.getlength(label) / 2.0
        rr = min(time_r + half_w * abs(ca), size * 0.5 - half_w - size * 0.004)
        tx, ty = cx + rr * ca, cy - rr * sa
        d.text((tx, ty), label, font=tick,
               fill=ACCENT if i == NEXT_INDEX else TEXT, anchor="mm")

    # "şimdi" işareti — merkez yazısını kapatmasın diye yalnızca iç kenarda
    a = math.radians(_ang(now))
    ca, sa = math.cos(a), math.sin(a)
    ln0, ln1 = inner - size * 0.065, inner + size * 0.006
    d.line([(cx + ln0 * ca, cy - ln0 * sa), (cx + ln1 * ca, cy - ln1 * sa)],
           fill=ACCENT, width=max(3, int(size * 0.010)))
    d.ellipse([cx + ln1 * ca - size * 0.022, cy - ln1 * sa - size * 0.022,
               cx + ln1 * ca + size * 0.022, cy - ln1 * sa + size * 0.022],
              fill=ACCENT)

    return img


# --------------------------------------------------------------------------- widget'lar

def render_grid(s):
    W, H = px(280), px(110)
    img, d = card(W, H)
    pad = px(9)
    f_city = font(10, False)
    f_label, f_time = font(10), font(15)
    keys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

    d.text((pad, pad), s["city"], font=f_city, fill=MUTED, anchor="lt")
    y = pad + px(14) + px(6)
    gap = px(1)
    cw = (W - 2 * pad - gap * 5) / 6.0
    ch = px(11 + 8)
    for i in range(6):
        x = pad + i * (cw + gap)
        d.rounded_rectangle([x, y, x + cw, y + ch], radius=px(9),
                            fill=CARD_FILL, outline=CARD_BORDER, width=max(1, px(1)))
        d.text((x + cw / 2, y + ch / 2), s[keys[i]], font=f_label,
               fill=ACCENT, anchor="mm")

    y += ch + px(6)
    divider(d, pad, y, W - pad)
    y += px(6) + px(2)
    for i in range(6):
        cx = pad + cw * (i + 0.5) + gap * i
        d.text((cx, y), fmt_time(TIMES[i]), font=f_time,
               fill=ACCENT if i == NEXT_INDEX else TEXT, anchor="mt")
    return img


def render_clock(s):
    W, H = px(340), px(340)
    img, d = card(W, H)
    pad = px(12)
    f_city = font(13)
    f_clock = font(46, mono=True)
    f_weekday = font(13)
    f_label = font(13)
    f_day = font(34, mono=True)
    f_month = font(13)
    f_name, f_time = font(12), font(13, mono=True)
    keys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

    # Gerçek widget hücreyi doldurup içeriği dikeyde ortalıyor: aynı hizada çiz.
    y = (H - px(243)) / 2.0 + pad

    d.text((W / 2, y), s["city"], font=f_city, fill=ACCENT, anchor="mt")
    y += px(16) + px(4)

    d.text((W / 2, y), "18:42", font=f_clock, fill=TEXT, anchor="mt")
    y += px(52)

    d.text((W / 2, y), s["weekday"], font=f_weekday, fill=MUTED, anchor="mt")
    y += px(18) + px(7)
    divider(d, pad, y, W - pad)
    y += px(1) + px(6)

    half = (W - 2 * pad) / 2.0
    left_x, right_x = pad + half / 2.0, pad + half * 1.5
    d.text((left_x, y), s["gregorian"], font=f_label, fill=ACCENT, anchor="mt")
    d.text((right_x, y), s["hijri"], font=f_label, fill=ACCENT, anchor="mt")
    y += px(17)
    d.text((left_x, y), "14", font=f_day, fill=ACCENT, anchor="mt")
    d.text((right_x, y), "25", font=f_day, fill=ACCENT, anchor="mt")
    y += px(44)
    d.text((left_x, y), s["greg_month"], font=f_month, fill=ACCENT, anchor="mt")
    d.text((right_x, y), s["hijri_month"], font=f_month, fill=ACCENT, anchor="mt")
    y += px(18)

    divider(d, pad, y, W - pad)
    y += px(1) + px(6)

    cw = (W - 2 * pad) / 6.0
    for i in range(6):
        d.text((pad + cw * (i + 0.5), y), s[keys[i]], font=f_name,
               fill=ACCENT, anchor="mt")
    y += px(14)
    for i in range(6):
        d.text((pad + cw * (i + 0.5), y), fmt_time(TIMES[i]), font=f_time,
               fill=ACCENT if i == NEXT_INDEX else TEXT, anchor="mt")
    return img


# --------------------------------------------------------------------------- analog

def make_analog_face(size=1024, hour=17, minute=20):
    """Temalı analog kadran: dış çember, 60 çentik, 12/3/6/9 ve akrep/yelkovan."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    cx = cy = size / 2.0
    r = size * 0.43

    # kadran zemini (panel, düşük alfa) + dış çember
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=PANEL[:3] + (46,))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=PANEL,
              width=max(1, int(size * 0.018)))

    # saat/dakika çentikleri
    for i in range(60):
        hour_tick = i % 5 == 0
        a = math.radians(-90 + i * 6)
        ca, sa = math.cos(a), math.sin(a)
        outer = r - size * 0.012
        length = size * 0.050 if hour_tick else size * 0.024
        d.line(
            [(cx + outer * ca, cy + outer * sa),
             (cx + (outer - length) * ca, cy + (outer - length) * sa)],
            fill=(TEXT if hour_tick else MUTED[:3] + (153,)),
            width=max(1, int(size * (0.011 if hour_tick else 0.005))),
        )

    # 12 / 3 / 6 / 9
    f_num = ImageFont.truetype(FONT_BOLD, int(size * 0.065))
    nr = r * 0.74
    for i, label in enumerate(("12", "3", "6", "9")):
        a = math.radians(-90 + i * 90)
        x = cx + nr * math.cos(a)
        y = cy + nr * math.sin(a)
        d.text((x, y), label, font=f_num, fill=MUTED, anchor="mm")

    # akrep + yelkovan
    ha = math.radians(-90 + (hour % 12 + minute / 60.0) * 30)
    ma = math.radians(-90 + minute * 6)
    d.line([(cx, cy), (cx + r * 0.48 * math.cos(ha), cy + r * 0.48 * math.sin(ha))],
           fill=TEXT, width=max(1, int(size * 0.030)))
    d.line([(cx, cy), (cx + r * 0.72 * math.cos(ma), cy + r * 0.72 * math.sin(ma))],
           fill=TEXT, width=max(1, int(size * 0.020)))

    # merkez noktası
    rc = size * 0.022
    d.ellipse([cx - rc, cy - rc, cx + rc, cy + rc], fill=ACCENT)
    return img


def make_second_hand(size=512):
    """Saniye ibresi: merkezden yukarı uzanan ince kırmızı çubuk.

    Kare tuvalin merkezi kadran merkezidir; kare 6°'lik adımlarla döndürülerek
    60 karelik ViewFlipper animasyonu üretilir.
    """
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img, "RGBA")
    cx = cy = size / 2.0
    color = (239, 68, 68, 255)
    w = max(2, int(size * 0.009))
    d.line([(cx, cy), (cx, cy - size * 0.36)], fill=color, width=w)
    d.line([(cx, cy), (cx, cy + size * 0.055)], fill=color, width=w)
    cap = size * 0.022
    d.ellipse([cx - cap, cy - cap, cx + cap, cy + cap], fill=color)
    return img


def render_analog(s):
    W, H = px(340), px(340)
    img, d = card(W, H)
    pad = px(10)
    f_city = font(13)
    f_name, f_time = font(12), font(13, mono=True)
    keys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

    y = pad
    d.text((W / 2, y), s["city"], font=f_city, fill=ACCENT, anchor="mt")
    y += px(18)

    # Alt bölüm: ayraç + ad + saat.
    reserve = px(6) + px(1) + px(6) + px(14) + px(15)
    frame_top = y
    frame_bottom = H - pad - reserve
    frame_h = frame_bottom - frame_top
    size = int(min(frame_h, W - 2 * pad))
    pos = (int((W - size) // 2), int(frame_top + (frame_h - size) // 2))
    face = make_analog_face(1024).resize((size, size), Image.LANCZOS)
    img.alpha_composite(face, pos)

    # Saniye ibresi (örnekte 35. saniye = 210°).
    hand = (make_second_hand(512)
            .resize((size, size), Image.LANCZOS)
            .rotate(-210, resample=Image.BICUBIC, expand=False))
    img.alpha_composite(hand, pos)

    y = frame_bottom + px(6)
    divider(d, pad, y, W - pad)
    y += px(1) + px(6)

    cw = (W - 2 * pad) / 6.0
    for i in range(6):
        d.text((pad + cw * (i + 0.5), y), s[keys[i]], font=f_name,
               fill=ACCENT, anchor="mt")
    y += px(14)
    for i in range(6):
        d.text((pad + cw * (i + 0.5), y), fmt_time(TIMES[i]), font=f_time,
               fill=ACCENT if i == NEXT_INDEX else TEXT, anchor="mt")
    return img


def render_arc(s):
    W, H = px(320), px(320)
    img, d = card(W, H)
    pad = px(8)
    f_city, f_next, f_detail = font(13), font(16), font(14)
    f_name, f_time = font(11), font(12, mono=True)
    keys = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]

    d.text((W / 2, pad), s["city"], font=f_city, fill=ACCENT, anchor="mt")

    # Alt satırlar: vakit adları + saatler.
    names_h, times_h = px(13), px(14)
    rows_h = names_h + px(1) + times_h
    frame_top = pad + px(16) + px(2)
    frame_bottom = H - pad - px(4) - rows_h
    frame_h, frame_w = frame_bottom - frame_top, W - 2 * pad
    size = int(min(frame_h, frame_w))

    ring = make_ring(1024).resize((size, size), Image.LANCZOS)
    img.alpha_composite(ring, (int((W - size) // 2),
                               int(frame_top + (frame_h - size) // 2)))

    cy = frame_top + frame_h / 2.0
    d.text((W / 2, cy - px(10)), s["maghrib"], font=f_next,
           fill=ACCENT, anchor="mm")
    d.text((W / 2, cy + px(16)), "18:42", font=f_detail,
           fill=TEXT, anchor="mm")

    y = H - pad - rows_h
    cw = (W - 2 * pad) / 6.0
    for i in range(6):
        d.text((pad + cw * (i + 0.5), y), s[keys[i]], font=f_name,
               fill=ACCENT, anchor="mt")
    y += names_h + px(1)
    for i in range(6):
        d.text((pad + cw * (i + 0.5), y), fmt_time(TIMES[i]), font=f_time,
               fill=ACCENT if i == NEXT_INDEX else TEXT, anchor="mt")
    return img


LABELS = {
    "en": dict(city="Istanbul", fajr="Fajr", sunrise="Sunrise", dhuhr="Dhuhr",
               asr="Asr", maghrib="Maghrib", isha="Isha", weekday="Friday",
               gregorian="Gregorian", hijri="Hijri", greg_month="March 2026",
               hijri_month="Ramadan 1447"),
    "tr": dict(city="İstanbul", fajr="İmsak", sunrise="Güneş", dhuhr="Öğle",
               asr="İkindi", maghrib="Akşam", isha="Yatsı", weekday="Cuma",
               gregorian="Miladi", hijri="Hicri", greg_month="Mart 2026",
               hijri_month="Ramazan 1447"),
}


def save(img, subdir, name):
    out = os.path.join(RES, subdir)
    os.makedirs(out, exist_ok=True)
    path = os.path.join(out, name)
    img.save(path, optimize=True)
    print(">>> %s" % os.path.relpath(path, ROOT))


def main():
    for lang, folder in (("en", "drawable-nodpi"), ("tr", "drawable-tr-nodpi")):
        s = LABELS[lang]
        save(render_grid(s), folder, "widget_grid_preview_img.png")
        save(render_clock(s), folder, "widget_clock_preview_img.png")
        save(render_analog(s), folder, "widget_analog_preview_img.png")
        save(render_arc(s), folder, "widget_arc_preview_img.png")
        save(make_ring(1024), folder, "widget_arc_ring.png")
        save(make_analog_face(1024), folder, "widget_analog_face.png")
        save(make_second_hand(512), folder, "widget_analog_second_hand.png")


if __name__ == "__main__":
    main()
