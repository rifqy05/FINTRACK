import { useEffect, useRef, useState } from "react";
import { Bot, Eraser, Loader2, LogIn, PlugZap, Send, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import {
  ASSISTANT_API_URL,
  MAX_QUESTION_LENGTH,
  SUGGESTED_QUESTIONS,
  askAssistant,
  checkAssistantHealth,
  clearAiConsent,
  hasAiConsent,
  saveAiConsent,
} from "../services/assistantService.js";

const SOURCE_LABEL = {
  ai: "Dijawab model AI berdasarkan perhitungan aplikasi",
  "perhitungan-aplikasi": "Dijawab langsung oleh perhitungan aplikasi (penyedia AI belum dikonfigurasi)",
  "tanpa-data": "Tidak ada data pada periode tersebut",
};

function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[46rem] ${isUser ? "items-end text-right" : ""}`}>
        <div
          className={
            isUser ? "rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm text-brand-ink" : "card px-4 py-3 text-sm"
          }
        >
          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
        </div>
        {!isUser && (message.period || message.source) ? (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-soft">
            {message.period ? (
              <span>
                Data dianalisis: {message.period.label} ({message.period.transactionCount} transaksi)
                {message.period.truncated ? ", hanya sebagian data terbaru" : ""}
              </span>
            ) : null}
            {message.source ? <span>{SOURCE_LABEL[message.source] ?? ""}</span> : null}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function Assistant({ user = null, onOpenAuth }) {
  const [consented, setConsented] = useState(hasAiConsent);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState({ state: "memeriksa" });

  const endRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    checkAssistantHealth().then((result) => {
      if (!mounted) return;
      setHealth(
        result.ok ? { state: "aktif", aiConfigured: result.aiConfigured } : { state: "mati", error: result.error },
      );
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  if (!user) {
    return (
      <EmptyState
        icon={Bot}
        title="Asisten AI membutuhkan akun cloud"
        description="Asisten menjawab berdasarkan transaksi dan anggaran yang tersimpan di akun FinTrack Anda, jadi Anda perlu masuk terlebih dahulu. Backend memverifikasi sesi Anda dan hanya membaca data milik Anda sendiri."
      >
        <button type="button" onClick={onOpenAuth} className="btn btn-primary">
          <LogIn size={18} strokeWidth={1.75} aria-hidden="true" />
          Masuk / Buat Akun
        </button>
      </EmptyState>
    );
  }

  if (!consented) {
    return (
      <section className="card p-5">
        <div className="flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <ShieldAlert size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">Sebelum menggunakan asisten AI</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              Agar bisa menjawab, pertanyaan Anda beserta <strong>ringkasan angka</strong> keuangan bulan terkait
              dikirim ke penyedia model AI yang dikonfigurasi di server. Yang dikirim hanya angka agregat: total
              pemasukan dan pengeluaran, daftar kategori beserta nominalnya, status anggaran, dan rata-rata bulanan.
              Keterangan transaksi, identitas akun, dan daftar transaksi mentah tidak dikirim. Semua angka dihitung oleh
              aplikasi ini, bukan oleh model AI.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              saveAiConsent();
              setConsented(true);
            }}
            className="btn btn-primary"
          >
            <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
            Saya mengerti, lanjutkan
          </button>
        </div>
      </section>
    );
  }

  async function send(text) {
    const value = (text ?? question).trim();
    if (value === "" || loading) return;

    setError(null);
    setQuestion("");
    setMessages((list) => [...list, { id: `u-${Date.now()}`, role: "user", text: value }]);
    setLoading(true);

    const result = await askAssistant(value);
    setLoading(false);

    if (result.ok) {
      setMessages((list) => [
        ...list,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: result.answer,
          period: result.period,
          source: result.source,
        },
      ]);
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
              <Bot size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-semibold tracking-tight">Asisten Keuangan</h2>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">
                Tanya apa pun tentang keuangan bulan ini. Angka selalu dihitung oleh FinTrack, asisten hanya
                menjelaskannya. Asisten hanya bisa membaca, tidak pernah mengubah data Anda.
              </p>
            </div>
          </div>

          {health.state === "aktif" ? (
            <span className="badge bg-brand-soft text-brand">
              <PlugZap size={14} strokeWidth={1.75} aria-hidden="true" />
              Backend aktif{health.aiConfigured ? "" : " (mode perhitungan aplikasi)"}
            </span>
          ) : null}
          {health.state === "mati" ? (
            <span className="badge bg-surface-2 text-ink-soft">
              <TriangleAlert size={14} strokeWidth={1.75} aria-hidden="true" />
              Backend tidak terhubung
            </span>
          ) : null}
        </div>

        {health.state === "mati" ? (
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            {health.error} Jalankan <code className="font-mono">npm run server</code> lalu muat ulang halaman. Alamat
            yang dipakai: <code className="font-mono">{ASSISTANT_API_URL}</code>.
          </p>
        ) : null}
      </section>

      <section className="card flex flex-col p-5">
        {messages.length === 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-soft">Belum ada pertanyaan. Coba salah satu contoh berikut:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_QUESTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => send(item)}
                  disabled={loading}
                  className="btn btn-secondary text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-3" aria-live="polite">
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
            {loading ? (
              <li className="flex justify-start">
                <p className="card flex items-center gap-2 px-4 py-3 text-sm text-ink-soft">
                  <Loader2 size={16} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
                  Menghitung data dan menyusun jawaban...
                </p>
              </li>
            ) : null}
          </ul>
        )}

        {error ? (
          <div role="alert" className="mt-4 rounded-lg border border-expense/40 bg-expense/5 px-3 py-2">
            <p className="text-sm font-medium text-expense">{error}</p>
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  const lastUser = [...messages].reverse().find((message) => message.role === "user");
                  if (lastUser) send(lastUser.text);
                }}
                className="btn btn-secondary mt-2"
              >
                Coba lagi
              </button>
            ) : null}
          </div>
        ) : null}

        <form
          className="mt-4 flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            send();
          }}
        >
          <label htmlFor="pertanyaan-asisten" className="text-sm font-medium">
            Pertanyaan Anda
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="pertanyaan-asisten"
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={MAX_QUESTION_LENGTH}
              placeholder="Contoh: kategori pengeluaran terbesar bulan ini apa?"
              className="input"
              autoComplete="off"
            />
            <button type="submit" disabled={loading || question.trim() === ""} className="btn btn-primary">
              {loading ? (
                <Loader2 size={18} strokeWidth={1.75} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
              {loading ? "Memproses..." : "Tanya"}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-soft">
              {question.length}/{MAX_QUESTION_LENGTH} karakter. Maksimal 15 pertanyaan per 10 menit.
            </p>
            {messages.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                }}
                className="btn btn-secondary"
              >
                <Eraser size={18} strokeWidth={1.75} aria-hidden="true" />
                Bersihkan percakapan
              </button>
            ) : null}
          </div>
        </form>

        <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-ink-soft">
          Dengan menggunakan fitur ini, ringkasan angka keuangan Anda dikirim ke penyedia AI yang dikonfigurasi server.{" "}
          <button
            type="button"
            onClick={() => {
              clearAiConsent();
              setConsented(false);
              setMessages([]);
            }}
            className="underline hover:text-ink"
          >
            Hentikan persetujuan ini
          </button>
          .
        </p>
        <div ref={endRef} />
      </section>
    </div>
  );
}
