// Verifikasi identitas pengguna.
//
// Token akses dari frontend tidak pernah dipercaya begitu saja: token selalu
// diperiksa ke Supabase Auth, dan user id diambil dari hasil pemeriksaan itu —
// bukan dari body request. Token tidak pernah ditulis ke log.

export function parseAccessToken(headerValue) {
  if (typeof headerValue !== "string") return "";
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export async function verifyAccessToken(token, config, fetchImpl = fetch) {
  if (!token) {
    return { ok: false, status: 401, error: "Sesi tidak ditemukan. Silakan masuk ke akun FinTrack Anda." };
  }
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      ok: false,
      status: 503,
      error: "Backend belum dikonfigurasi: SUPABASE_URL dan SUPABASE_ANON_KEY belum diisi di berkas .env server.",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.aiTimeoutMs);

  try {
    const response = await fetchImpl(`${config.supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, status: 401, error: "Sesi tidak valid atau sudah berakhir. Silakan masuk kembali." };
    }
    if (!response.ok) {
      return { ok: false, status: 502, error: "Gagal memverifikasi sesi ke Supabase." };
    }

    const data = await response.json();
    if (!data || typeof data.id !== "string" || data.id === "") {
      return { ok: false, status: 401, error: "Sesi tidak valid. Silakan masuk kembali." };
    }

    return { ok: true, user: { id: data.id, email: typeof data.email === "string" ? data.email : null } };
  } catch {
    return { ok: false, status: 502, error: "Tidak dapat menghubungi Supabase untuk memverifikasi sesi." };
  } finally {
    clearTimeout(timer);
  }
}
