import React, { useState } from 'react';
import { Sparkles, RefreshCw, Clipboard, Check, ShieldAlert, Award, ArrowUpRight, TrendingUp } from 'lucide-react';
import { FinanceData, IuranData } from '../types';
import { formatMoney } from '../utils';

interface AiRingkasanProps {
  financeData: FinanceData;
  iuranData: IuranData;
}

// Simple Parser to safely format markdown syntax into JSX elements
function parseMarkdown(text: string): React.ReactNode[] {
  return text.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) {
      return (
        <h4 key={idx} className="text-xs font-black text-sky-300 mt-4 mb-2 tracking-wide uppercase">
          {trimmed.substring(4)}
        </h4>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h3 key={idx} className="text-sm font-extrabold text-white mt-5 mb-2 border-b border-white/5 pb-1 flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          {trimmed.substring(3)}
        </h3>
      );
    }
    if (trimmed.startsWith('# ')) {
      return (
        <h2 key={idx} className="text-base font-black text-white mt-6 mb-3 bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent uppercase tracking-wider">
          {trimmed.substring(2)}
        </h2>
      );
    }
    // Bullet points: - or *
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const cleanLine = trimmed.substring(2);
      return (
        <li key={idx} className="text-xs text-slate-300 ml-4 list-disc mb-1.5 leading-relaxed">
          {renderInlineBold(cleanLine)}
        </li>
      );
    }
    // Numbered lists: e.g. "1. "
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      return (
        <div key={idx} className="text-xs text-slate-300 mb-2 leading-relaxed flex items-start gap-2.5 pl-1">
          <span className="font-extrabold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded text-[10px] shrink-0 mt-0.5">
            {numMatch[1]}
          </span>
          <span className="flex-1">{renderInlineBold(numMatch[2])}</span>
        </div>
      );
    }
    // Standard paragraph
    if (trimmed === '') return <div key={idx} className="h-2" />;
    return (
      <p key={idx} className="text-xs text-slate-300 mb-2.5 leading-relaxed">
        {renderInlineBold(trimmed)}
      </p>
    );
  });
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*([^*]+)\*\*/);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <strong key={index} className="font-bold text-white px-1 py-0.2 bg-white/5 border border-white/5 rounded text-[11px]">
          {part}
        </strong>
      );
    }
    return part;
  });
}

export default function AiRingkasan({ financeData, iuranData }: AiRingkasanProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    setSummary('');
    setLoadingStep('Menganalisis database transaksi...');

    const steps = [
      'Menghubungkan ke server Gemini AI...',
      'Mengevaluasi partisipasi iuran siswa...',
      'Mendalami perbandingan pengeluaran vs anggaran...',
      'Merumuskan rekomendasi keputusan strategis...'
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < steps.length) {
        setLoadingStep(steps[currentStepIdx]);
        currentStepIdx++;
      }
    }, 1500);

    try {
      const res = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          finance: financeData,
          iuran: iuranData
        })
      });

      clearInterval(interval);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server HTTP error status: ${res.status}`);
      }

      const data = await res.json();
      setSummary(data.text || 'Tidak ada teks yang dihasilkan.');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memanggil API Gemini.');
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 border border-white/10 p-6 sm:p-8 rounded-3xl shadow-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] text-blue-300 font-extrabold uppercase tracking-widest leading-none">
            <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse" /> Asisten Analisis Pintar
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
            Ringkasan &amp; Analisis Finansial AI
          </h2>
          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Menghasilkan ringkasan eksekutif komprehensif, performa iuran bulanan siswa, serta usulan strategis untuk membantu pengambilan keputusan secara cepat dan rasional.
          </p>
        </div>

        <button
          onClick={handleGenerateSummary}
          disabled={loading}
          className="shrink-0 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-xs py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-blue-500/25 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          )}
          {summary ? 'Perbarui Analisis AI' : 'Mulai Analisis AI Sekarang'}
        </button>
      </div>

      {loading && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-4 shadow-xl">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-ping" />
            <div className="relative w-16 h-16 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-center text-blue-400 shadow-inner">
              <Sparkles className="w-8 h-8 animate-pulse text-yellow-400" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-extrabold text-white">Sedang Menganalisis...</p>
            <p className="text-xs text-slate-400 font-mono tracking-wide">{loadingStep}</p>
          </div>
          <div className="w-48 h-1 bg-white/5 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-2/3 rounded-full animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Analisis Gagal</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">{error}</p>
          </div>
          <button
            onClick={handleGenerateSummary}
            className="text-xs font-black bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/35 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Coba Kembali
          </button>
        </div>
      )}

      {summary && !loading && (
        <div className="bg-slate-950/80 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Header Bar */}
          <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <Sparkles className="w-4 h-4 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Laporan Hasil Keputusan AI</h4>
                <p className="text-[10px] text-slate-400 font-mono">Dibuat menggunakan model Gemini 3.5 Flash</p>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className="p-2 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs font-bold cursor-pointer bg-white/5 active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Salin Hasil</span>
                </>
              )}
            </button>
          </div>

          {/* Render Content */}
          <div className="p-6 sm:p-8 space-y-4">
            <div className="prose prose-invert max-w-none text-xs text-slate-300 select-text">
              {parseMarkdown(summary)}
            </div>
          </div>
        </div>
      )}

      {/* Static quick metrics panel shown when summary is empty to encourage usage */}
      {!summary && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-bold text-white">Ringkasan Arus Kas</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mengevaluasi trend surplus/defisit dari mutasi kas ledger yang masuk secara rinci dan objektif.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Award className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-bold text-white">Rasio Partisipasi</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mengecek persentase kelulusan iuran murid bulanan guna mendeteksi siswa penunggak secara preventif.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h5 className="text-xs font-bold text-white">Usulan Taktis</h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Gemini memberikan rancangan aksi perbaikan penagihan atau penghematan anggaran yang berorientasi hasil.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
