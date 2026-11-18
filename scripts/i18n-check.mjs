#!/usr/bin/env node
/**
 * Dil denetimi.
 *
 * Kullanım:
 *   npm run i18n:check           # uyarıları göster, hatalarda çık
 *   npm run i18n:check:strict    # eksik anahtarlar da hata sayılsın
 *
 * Kontroller:
 *  - locales/*.ts dosyaları kayıt defterine eklenmiş mi?
 *  - mesaj anahtarları İngilizce ile tutarlı mı, yer tutucular ({ad}) aynı mı?
 *  - hicri ay listesi 12 eleman mı?
 *  - esma anahtarları temel listeyle aynı mı?
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { LOCALES, LANGUAGE_ORDER } = await import(path.join(ROOT, "src/i18n/index.ts"));

const strict = process.argv.includes("--strict");
const errors = [];
const warnings = [];

// 1) Klasörde olup kayıt defterinde olmayan dosya
const files = fs.readdirSync(path.join(ROOT, "src/i18n/locales"))
  .filter((f) => f.endsWith(".ts") && f !== "index.ts")
  .map((f) => f.slice(0, -3));
for (const code of files) {
  if (!LANGUAGE_ORDER.includes(code)) {
    errors.push(`locales/${code}.ts var ama locales/index.ts içinde kayıtlı değil`);
  }
}

const placeholders = (s) => [...String(s).matchAll(/\{([A-Za-z0-9_]+)\}/g)].map((m) => m[1]).sort().join(",");

const en = LOCALES.en;
const enKeys = Object.keys(en.messages);

for (const code of LANGUAGE_ORDER) {
  const loc = LOCALES[code];
  const missing = enKeys.filter((k) => !(k in loc.messages));
  const extra = Object.keys(loc.messages).filter((k) => !(k in en.messages));

  if (missing.length) {
    const msg = `${code}: ${missing.length} eksik mesaj anahtarı -> ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? "…" : ""}`;
    (strict ? errors : warnings).push(msg);
  }
  if (extra.length) warnings.push(`${code}: ${extra.length} fazla anahtar -> ${extra.join(", ")}`);

  for (const key of enKeys) {
    const v = loc.messages[key];
    if (v === undefined) continue;
    if (v.trim() === "") warnings.push(`${code}.${key}: boş metin (bilinçli olabilir)`);
    if (placeholders(v) !== placeholders(en.messages[key])) {
      errors.push(`${code}.${key}: yer tutucu uyuşmuyor (en: ${placeholders(en.messages[key]) || "-"}, ${code}: ${placeholders(v) || "-"})`);
    }
  }

  // hijriMonths opsiyoneldir: yoksa İngilizce listeye düşer.
  if (loc.hijriMonths !== undefined) {
    if (!Array.isArray(loc.hijriMonths) || loc.hijriMonths.length !== 12) {
      errors.push(`${code}: hijriMonths 12 eleman olmalı (veya hiç yazılmamalı)`);
    } else if (loc.hijriMonths.some((m) => !m || !m.trim())) {
      errors.push(`${code}: hijriMonths içinde boş ay adı var`);
    }
  }

  if (loc.esma) {
    const baseKeys = Object.keys(en.esma ?? {});
    const miss = baseKeys.filter((k) => !(k in loc.esma));
    if (miss.length && code !== "tr" && code !== "ar" && code !== "de" && code !== "ur") {
      warnings.push(`${code}: ${miss.length} eksik esma anlamı`);
    }
  }
}

if (warnings.length) {
  console.log("UYARILAR");
  for (const w of warnings) console.log("  • " + w);
}
if (errors.length) {
  console.log("\nHATALAR");
  for (const e of errors) console.log("  ✗ " + e);
  process.exit(1);
}
console.log(`\n✓ ${LANGUAGE_ORDER.length} dil denetlendi${strict ? " (strict)" : ""}. Hata yok.`);
if (!strict && warnings.length) console.log("  (eksik anahtarlar strict modda hata sayılır)");
