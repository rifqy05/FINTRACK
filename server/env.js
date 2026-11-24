// Konfigurasi backend dari environment variables.
//
// Tidak ada secret yang ditulis di berkas ini. Rahasia (service role key, API key
// penyedia AI, client secret Google) hanya dibaca dari environment server dan
// tidak pernah dikirim ke frontend.

function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULTS = {
  port: 8787,
  aiBaseUrl: "https://api.openai.com/v1",
  aiMaxTokens: 700,
  aiTimeoutMs: 30_000,
  maxQuestionLength: 500,
  maxBodyBytes: 16 * 1024,
  rateLimitMax: 15,
  rateLimitWindowMs: 10 * 60 * 1000,
  dataMonthsBack: 3,
  dataRowLimit: 2000,
  allowedOrigin: "http://localhost:5173",
};

export function readServerEnv(env = process.env) {
  // VITE_SUPABASE_* dipakai sebagai cadangan agar satu berkas .env bisa dipakai
  // bersama frontend. Keduanya memang nilai publik (anon key), bukan rahasia.
  const supabaseUrl = (text(env.SUPABASE_URL) || text(env.VITE_SUPABASE_URL)).replace(/\/+$/, "");
  const supabaseAnonKey = text(env.SUPABASE_ANON_KEY) || text(env.VITE_SUPABASE_ANON_KEY);

  const aiApiKey = text(env.AI_PROVIDER_API_KEY);
  const aiModel = text(env.AI_MODEL);

  const rawOrigins = text(env.AI_ALLOWED_ORIGIN) || DEFAULTS.allowedOrigin;
  const allowedOrigins = rawOrigins
    .split(",")
    .map((item) => item.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return {
    port: positiveInt(env.PORT, DEFAULTS.port),
    supabaseUrl,
    supabaseAnonKey,
    // Backend memakai token pengguna + anon key, jadi service role key tidak dibutuhkan.
    aiApiKey,
    aiModel,
    aiBaseUrl: (text(env.AI_BASE_URL) || DEFAULTS.aiBaseUrl).replace(/\/+$/, ""),
    aiMaxTokens: positiveInt(env.AI_MAX_TOKENS, DEFAULTS.aiMaxTokens),
    aiTimeoutMs: positiveInt(env.AI_TIMEOUT_MS, DEFAULTS.aiTimeoutMs),
    aiEnabled: Boolean(aiApiKey && aiModel),
    maxQuestionLength: positiveInt(env.AI_MAX_QUESTION_LENGTH, DEFAULTS.maxQuestionLength),
    maxBodyBytes: positiveInt(env.AI_MAX_BODY_BYTES, DEFAULTS.maxBodyBytes),
    rateLimitMax: positiveInt(env.AI_RATE_LIMIT_MAX, DEFAULTS.rateLimitMax),
    rateLimitWindowMs: positiveInt(env.AI_RATE_LIMIT_WINDOW_MS, DEFAULTS.rateLimitWindowMs),
    dataMonthsBack: positiveInt(env.AI_DATA_MONTHS_BACK, DEFAULTS.dataMonthsBack),
    dataRowLimit: positiveInt(env.AI_DATA_ROW_LIMIT, DEFAULTS.dataRowLimit),
    allowedOrigin: allowedOrigins[0] || DEFAULTS.allowedOrigin,
    allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : [DEFAULTS.allowedOrigin],
  };
}

// Ringkasan konfigurasi untuk log saat server mulai. Hanya berisi status,
// tidak pernah berisi nilai secret.
export function describeServerEnv(config) {
  return {
    port: config.port,
    supabase: config.supabaseUrl && config.supabaseAnonKey ? "terkonfigurasi" : "belum lengkap",
    penyediaAi: config.aiEnabled ? `aktif (${config.aiBaseUrl}, model ${config.aiModel})` : "belum dikonfigurasi",
    allowedOrigin: config.allowedOrigin,
  };
}
