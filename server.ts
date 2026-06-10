import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    ai = new GoogleGenAI({
      apiKey: key || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// API Route for AI Summary of Finance + Student Dues
app.post("/api/gemini/summary", async (req, res) => {
  try {
    const { finance, iuran } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ 
        error: "Kunci API Gemini belum dikonfigurasi. Harap konfigurasikan GEMINI_API_KEY di panel Settings > Secrets." 
      });
    }

    const client = getGeminiClient();

    // Format transaction and student data cleanly for model prompt
    const txList = (finance?.transactions || [])
      .map((t: any) => `- [${t.date}] [${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}] Rp${t.amount.toLocaleString('id-ID')} - ${t.note}`)
      .slice(0, 40) // Limit to latest 40 for token budget
      .join("\n");

    const students = iuran?.students || [];
    const totalStudents = students.length;
    let lunasCount = 0;
    let totalDuesCollected = 0;
    
    students.forEach((st: any) => {
      let isLunasAll = true;
      Object.keys(st.pembayaran || {}).forEach(m => {
        const p = st.pembayaran[m];
        if (p.status === 'Lunas') {
          totalDuesCollected += Number(p.nominal || 0);
        } else {
          isLunasAll = false;
        }
      });
      if (isLunasAll && Object.keys(st.pembayaran || {}).length > 0) lunasCount++;
    });

    const activeKelas = iuran?.kelasList?.find((k: any) => k.id === iuran.activeKelasId) || iuran?.kelasList?.[0];
    const className = activeKelas ? activeKelas.name : "Kelas Utama";

    const prompt = `
Anda adalah seorang konsultan keuangan profesional dan asisten admin sekolah/madrasah.
Berdasarkan data berikut, buat analisis keuangan yang ringkas, strategis, dan menarik dalam Bahasa Indonesia.

Detail Lembaga/Kelas:
- Nama Lembaga: ${className}
- Total Siswa: ${totalStudents} orang.
- Total Iuran Siswa Terkumpul: Rp${totalDuesCollected.toLocaleString('id-ID')}

Daftar Transaksi Keuangan Terakhir (Maks 40 Transaksi):
${txList || "Tidak ada transaksi tercatat."}

Analisislah data tersebut dan susun laporan dalam format Markdown yang elegan dengan bagian-bagian berikut:
1. **Ringkasan Eksekutif (Pemasukan vs Pengeluaran)**: Analisis perbandingan pemasukan & pengeluaran dari arus kas aktual. Berikan evaluasi kondisi finansial saat ini.
2. **Kesehatan Iuran Siswa**: Evaluasi tingkat partisipasi iuran siswa kelas ini beserta total terkumpul.
3. **Rekomendasi & Langkah Strategis**: Berikan 3 poin rekomendasi praktis, aplikatif, dan inovatif untuk meningkatkan efisiensi administrasi dan keuangan lembaga ini.

Harap berikan respons dalam Markdown yang rapi, ringkas, profesional (maksimal 300 kata), tanpa jargon berlebihan, serta memotivasi pengurus lembaga.
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert financial consultant and school administration helper.",
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    res.status(500).json({ error: err.message || "Gagal menghasilkan ringkasan data." });
  }
});

async function bootstrapServer() {
  // Vite middleware for development
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
    console.log(`Server running on port ${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error("Failed to start server:", err);
});
