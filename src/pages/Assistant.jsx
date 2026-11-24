import { useEffect, useRef, useState } from "react";
import { Bot, Eraser, Loader2, LogIn, PlugZap, Send, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import EmptyState from "../components/EmptyState.jsx";
import MonthPicker from "../components/MonthPicker.jsx";
import { currentMonthKey, formatMonthLabel } from "../utils/dates.js";
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
  "perhitungan-aplikasi": "Dijawab langsung oleh perhitungan aplikasi",
  "tanpa-data": "Tidak ada data pada periode tersebut",
};

const QUICK_PROMPTS = SUGGESTED_QUESTIONS.slice(0, 4);

function Message({ message }) {
  const isUser = message.role === "user";
  return (
    <li className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[44rem] ${isUser ? "items-end text-right" : ""}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm text-brand-ink"
              : "rounded-2xl rounded-bl-md border border-line bg-surface-2 px-4 py-3 text-sm text-ink"
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
            {message.source ? <span>· {SOURCE_LABEL[message.source] ?? ""}</span> : null}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export default function Assistant({ user = null, onOpenAuth }) {
  const [consented, setConsented] = useState(hasAiConsent);
  const [month, setMonth] = useState(currentMonthKey);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [health, setHealth] = useState({ state: "idle" });

  const endRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;
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
  }, [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, loading]);

  if (!user) {
    return (
      <EmptyState
        icon={Bot}
        title="Asisten AI membutuhkan akun cloud"
        description="Asisten menjawab berdasarkan transaksi dan anggaran di akun cloud Anda, sehingga Anda perlu masuk terlebih dahulu. Hanya ringkasan angka milik Anda sendiri yang dibaca."
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
      <section className="card max-w-2xl p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-ink">
            <ShieldAlert size={19} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">Sebelum menggunakan asisten AI</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft text-pretty">
              Agar bisa menjawab, pertanyaan Anda beserta <strong>ringkasan angka</strong> keuangan periode terpilih
              diproses oleh layanan AI. Yang dikirim hanya angka agregat: total pemasukan dan pengeluaran, daftar
              kategori beserta nominalnya, status anggaran, dan rata-rata bulanan. Keterangan transaksi, identitas akun,
              dan daftar transaksi mentah tidak dikirim. Semua angka dihitung oleh aplikasi ini, bukan oleh model AI.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
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

    const result = await askAssistant(value, month);
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
    <div className="grid gap-5 xl:grid-cols-[340px_1fr] xl:items-start">
      <section className="card flex flex-col gap-4 p-5 xl:sticky xl:top-28">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface-2 text-ink">
              <Bot size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-base font-semibold tracking-tight">Konteks analisis</h2>
              <p className="text-xs text-ink-soft">Hanya baca · angka deterministik</p>
            </div>
          </div>
        </div>

        {health.state === "aktif" ? (
          <span className="badge border-line-strong bg-surface-2 text-ink">
            <PlugZap size={13} strokeWidth={1.75} aria-hidden="true" />
            Layanan aktif{health.aiConfigured ? "" : " (perhitungan lokal)"}
          </span>
        ) : null}
        {health.state === "mati" ? (
          <span className="badge border-warn/30 bg-warn-soft text-warn">
            <TriangleAlert size={13} strokeWidth={1.75} aria-hidden="true" />
            Layanan asisten belum terhubung
          </span>
        ) : null}

        <div className="border-t border-line pt-4">
          <MonthPicker idPrefix="assistant" value={month} onChange={setMonth} />
        </div>

        <div className="border-t border-line pt-4">
          <p className="text-xs font-medium text-ink-soft">Contoh pertanyaan cepat</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {QUICK_PROMPTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => send(item)}
                disabled={loading}
                className="btn btn-secondary h-auto justify-start py-2.5 text-left text-xs whitespace-normal"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {health.state === "mati" ? (
          <details className="rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-xs text-ink-soft">
            <summary className="font-medium text-ink">Cara menyalakan layanan asisten</summary>
            <p className="mt-2 leading-relaxed">
              Jalankan <code className="font-mono text-ink">npm run server</code> lalu muat ulang halaman. Alamat saat
              ini: <code className="font-mono text-ink">{ASSISTANT_API_URL}</code>.
            </p>
          </details>
        ) : null}

        <p className="border-t border-line pt-3 text-xs leading-relaxed text-ink-soft text-pretty">
          Hanya ringkasan angka yang diproses AI.{" "}
          <button
            type="button"
            onClick={() => {
              clearAiConsent();
              setConsented(false);
              setMessages([]);
            }}
            className="underline hover:text-ink"
          >
            Hentikan persetujuan
          </button>
          .
        </p>
      </section>

      <section className="card flex min-h-[28rem] flex-col justify-between p-5">
        <div className="flex-1">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-start justify-center py-10 sm:items-center sm:text-center">
              <Sparkles size={26} strokeWidth={1.6} aria-hidden="true" className="text-ink-soft" />
              <h3 className="mt-3 text-base font-semibold tracking-tight">
                Tanyakan keuangan {formatMonthLabel(month)}
              </h3>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft text-pretty">
                Pilih pertanyaan cepat di samping atau tulis pertanyaan Anda sendiri di bawah — termasuk simulasi target
                menabung.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3.5" aria-live="polite">
              {messages.map((message) => (
                <Message key={message.id} message={message} />
              ))}
              {loading ? (
                <li className="flex justify-start">
                  <p className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-sm text-ink-soft">
                    <Loader2 size={16} strokeWidth={1.75} className="animate-spin text-ink" aria-hidden="true" />
                    Menghitung data dan menyusun jawaban...
                  </p>
                </li>
              ) : null}
            </ul>
          )}

          {error ? (
            <div role="alert" className="mt-4 rounded-xl border border-expense/35 bg-expense-soft px-3.5 py-2.5">
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
        </div>

        <form
          className="mt-5 flex flex-col gap-2 border-t border-line pt-4"
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
              placeholder="Contoh: jika ingin menabung 5 juta, berapa bulan?"
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
              {question.length}/{MAX_QUESTION_LENGTH} karakter · Maksimal 15 pertanyaan per 10 menit.
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
                <Eraser size={16} strokeWidth={1.75} aria-hidden="true" />
                Bersihkan
              </button>
            ) : null}
          </div>
        </form>
        <div ref={endRef} />
      </section>
    </div>
  );
}
