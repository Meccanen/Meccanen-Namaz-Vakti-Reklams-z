import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with telemetry header as required by guidelines
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Weather proxy endpoint to Open-Meteo (No API keys needed)
app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ error: "lat ve lon parametreleri gereklidir." });
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    if (!response.ok) {
      throw new Error("Hava durumu servisinden başarısız yanıt alındı.");
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Hava durumu çekme hatası:", error);
    return res.status(500).json({ error: "Hava durumu verileri alınamadı." });
  }
});

// Geocoding proxy endpoint for custom cities
app.get("/api/geocode", async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: "Arama anahtar kelimesi (q) gereklidir." });
  }

  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        String(q)
      )}&count=5&language=tr`
    );
    if (!response.ok) {
      throw new Error("Geocoding servisinden başarısız yanıt alındı.");
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Geocoding hatası:", error);
    return res.status(500).json({ error: "Konum arama servisinde bir sorun oluştu." });
  }
});

// Gemini insights endpoint
app.post("/api/gemini/insights", async (req, res) => {
  const { city, country, temp, weatherDesc, dateGregorian, dateHijri, timeOfDay } = req.body;

  if (!ai) {
    return res.json({
      advice: "AI Servisi şu anda aktif değil. Lütfen Settings > Secrets bölümünden GEMINI_API_KEY anahtarınızı ekleyin.",
      historicalNote: "Miladi ve Hicri takvim takibi ve yerel saat bilgisi başarıyla gösterilmektedir."
    });
  }

  try {
    const prompt = `
      Şehir: ${city || "Bilinmiyor"}, Ülke: ${country || "Türkiye"}
      Mevcut Sıcaklık: ${temp || "Bilinmiyor"}
      Hava Durumu Açıklaması: ${weatherDesc || "Bilinmiyor"}
      Günün Saati: ${timeOfDay || "Gündüz"}
      Miladi Tarih: ${dateGregorian || "Bilinmiyor"}
      Hicri Tarih: ${dateHijri || "Bilinmiyor"}

      Lütfen yukarıdaki bilgilere göre Türkçe, kısa ve son derece zarif iki farklı metin oluştur. 
      JSON formatında şu iki alanı içeren bir nesne döndür:
      1. "advice": Bu sıcaklığa/havaya ve günün vaktine göre yapıcı, çok kısa bir giyim veya yaşam tavsiyesi (en fazla 15 kelime).
      2. "historicalNote": Bu Miladi/Hicri tarih bağlamına, mevsime veya şehre dair estetik ve bilgece edebi veya kültürel bir not (tarihi bir olay, günün anlam ve önemi, atasözü veya şiirsel bir mevsim selamlaması - en fazla 25 kelime).

      Yalnızca saf JSON nesnesi döndür, markdown kod blokları (\`\`\`json ve \`\`\`) kullanma, ek metin yazma.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    try {
      const parsed = JSON.parse(text);
      return res.json(parsed);
    } catch {
      return res.json({
        advice: `${temp} derece sıcaklığa uygun hafif ve rüzgar korumalı kıyafetler seçebilirsiniz.`,
        historicalNote: `${dateGregorian} gününde ${city} şehrinde huzurlu ve bereketli bir gün dileriz.`
      });
    }
  } catch (error: any) {
    console.error("Gemini hatası:", error);
    return res.json({
      advice: "Günün şartlarına uygun, rahat ve koruyucu kıyafetler tercih edebilirsiniz.",
      historicalNote: "Tarihin ve zamanın sunduğu tüm güzelliklerin yaşamınıza huzur getirmesini dileriz."
    });
  }
});

// Vite server connection integration
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is listening on http://0.0.0.0:${PORT}`);
});
