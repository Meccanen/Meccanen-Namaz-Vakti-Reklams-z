#!/usr/bin/env node
/**
 * Çeviri kontrol listesi üretir.
 *
 * Kullanım:
 *   npm run i18n:export fa
 *   -> docs/fa-ceviri-kontrol.txt
 *
 * Dosya sekmeyle ayrılmıştır (TSV): sıra | anahtar | Türkçe | İngilizce | hedef dil
 * Excel/LibreOffice/Google Sheets ile açıp düzeltebilirsiniz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { LOCALES, LANGUAGE_ORDER, getNotificationText } = await import(path.join(ROOT, "src/i18n/index.ts"));

const code = process.argv[2];
if (!code) {
  console.error("Kullanım: npm run i18n:export <dil-kodu>   (örn. fa)");
  process.exit(1);
}
if (!LANGUAGE_ORDER.includes(code)) {
  console.error(`Bilinmeyen dil: ${code}. Kayıtlı diller: ${LANGUAGE_ORDER.join(", ")}`);
  process.exit(1);
}

const target = LOCALES[code];
const en = LOCALES.en;
const tr = LOCALES.tr;
const lines = [];
const clean = (s) => String(s ?? "").replace(/\t/g, " ").replace(/\r?\n/g, " ");

let n = 0;
const row = (key, trText, enText, targetText) => {
  n++;
  lines.push([n, key, clean(trText), clean(enText), clean(targetText)].join("\t"));
};

lines.push(`# ${code.toUpperCase()} ÇEVİRİ KONTROL LİSTESİ`);
lines.push(`# Dil: ${target.meta.label} (${target.meta.locale}, ${target.meta.dir})`);
lines.push("# Sütunlar: sıra | anahtar | Türkçe | İngilizce | hedef dil");
lines.push("# Farsça sütunundaki karşılıkları kontrol edip düzeltin; {ad} yer tutucularını koruyun.");
lines.push("");

lines.push("## ARAYÜZ");
for (const key of Object.keys(en.messages)) {
  row(key, tr.messages[key], en.messages[key], target.messages[key]);
}
lines.push("");

lines.push("## HİCRİ AYLAR");
// hijriMonths tanımlı değilse çalışma zamanında İngilizce liste gösterilir.
en.hijriMonths?.forEach((v, i) =>
  row(`hijriMonths[${i}]`, tr.hijriMonths?.[i], v, target.hijriMonths?.[i] ?? v));
lines.push("");

lines.push("## HESAPLAMA YÖNTEMLERİ");
for (const id of Object.keys(en.prayerMethods ?? {})) {
  row(`method.${id}.label`, tr.prayerMethods?.[id]?.label, en.prayerMethods[id].label, target.prayerMethods?.[id]?.label);
  row(`method.${id}.description`, tr.prayerMethods?.[id]?.description, en.prayerMethods[id].description, target.prayerMethods?.[id]?.description);
}
lines.push("");

lines.push("## BİLDİRİM METİNLERİ");
for (const key of Object.keys(en.notifications ?? {})) {
  // `prayer_*` anahtarları için arayüz mesajlarına düşen etkin metni göster.
  const effective = key in (target.notifications ?? {})
    ? target.notifications[key]
    : getNotificationText(key, code);
  row(key, tr.notifications?.[key] ?? getNotificationText(key, "tr"), en.notifications[key], effective);
}
lines.push("");

lines.push("## ESMA-İ HÜSNA ANLAMLARI");
for (const key of Object.keys(en.esma ?? {})) {
  row(`esma.${key}`, tr.esma?.[key], en.esma[key], target.esma?.[key]);
}
lines.push("");

lines.push("## ESMA ETİKETLERİ (GEZEGEN / GÜN BÖLÜMÜ)");
for (const kind of ["planets", "segments"]) {
  for (const key of Object.keys(en.esmaLabels?.[kind] ?? {})) {
    row(`${kind}.${key}`, tr.esmaLabels?.[kind]?.[key], en.esmaLabels[kind][key], target.esmaLabels?.[kind]?.[key]);
  }
}
lines.push("");

const outDir = path.join(ROOT, "docs");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, `${code}-ceviri-kontrol.txt`);
fs.writeFileSync(outFile, lines.join("\n") + "\n", "utf8");
console.log(`✓ ${n} satır yazıldı -> ${path.relative(ROOT, outFile)}`);
