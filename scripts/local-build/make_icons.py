from PIL import Image
import os

def make_icon(size, out_path, margin_ratio=0.80):
    img = Image.new('RGBA', (size, size), (2, 6, 23, 255))
    logo = Image.open('public/meccanen-logo.png').convert('RGBA')
    target_w = int(size * margin_ratio)
    ratio = target_w / logo.width
    target_h = int(logo.height * ratio)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    img.paste(logo, (x, y), logo)
    img.save(out_path)
    print(f"OK {out_path}")

def make_foreground(size, out_path, margin_ratio=0.54):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    logo = Image.open('public/meccanen-logo.png').convert('RGBA')
    target_w = int(size * margin_ratio)
    ratio = target_w / logo.width
    target_h = int(logo.height * ratio)
    logo = logo.resize((target_w, target_h), Image.LANCZOS)
    x = (size - target_w) // 2
    y = (size - target_h) // 2
    img.paste(logo, (x, y), logo)
    img.save(out_path)
    print(f"OK {out_path}")

base = 'android/app/src/main/res'
for d, s in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
    os.makedirs(f'{base}/mipmap-{d}', exist_ok=True)
    make_icon(s, f'{base}/mipmap-{d}/ic_launcher.png')
    make_icon(s, f'{base}/mipmap-{d}/ic_launcher_round.png')

for d, s in [('mdpi',108),('hdpi',162),('xhdpi',216),('xxhdpi',324),('xxxhdpi',432)]:
    os.makedirs(f'{base}/mipmap-{d}', exist_ok=True)
    make_foreground(s, f'{base}/mipmap-{d}/ic_launcher_foreground.png')

bg_color_path = f'{base}/values/ic_launcher_background.xml'
if os.path.exists(bg_color_path):
    with open(bg_color_path) as f:
        content = f.read()
    content = content.replace('#FFFFFF', '#020617').replace('#ffffff', '#020617')
    with open(bg_color_path, 'w') as f:
        f.write(content)
    print(">>> ic_launcher_background rengi navy yapildi.")
else:
    print(">>> UYARI: ic_launcher_background.xml bulunamadi.")
