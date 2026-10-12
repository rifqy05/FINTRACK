import { supabase, isSupabaseConfigured } from "./supabaseClient.js";

function formatAuthError(error) {
  if (!error) return "Terjadi kesalahan pada autentikasi.";
  const msg = error.message?.toLowerCase() || "";

  if (msg.includes("invalid login credentials")) {
    return "Email atau kata sandi salah. Silakan coba lagi.";
  }
  if (msg.includes("user already registered") || msg.includes("already registered")) {
    return "Email ini sudah terdaftar. Silakan masuk (login).";
  }
  if (msg.includes("password should be at least")) {
    return "Kata sandi minimal terdiri dari 6 karakter.";
  }
  if (msg.includes("email not confirmed")) {
    return "Email belum dikonfirmasi. Periksa kotak masuk email Anda.";
  }
  if (msg.includes("network") || msg.includes("fetch failed")) {
    return "Gagal terhubung ke server Supabase. Periksa koneksi internet Anda.";
  }
  return error.message || "Gagal memproses autentikasi.";
}

export async function signUp({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase belum dikonfigurasi. Periksa berkas .env Anda." };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: formatAuthError(error) };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: formatAuthError(err) };
  }
}

export async function signIn({ email, password }) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: "Supabase belum dikonfigurasi. Periksa berkas .env Anda." };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { ok: false, error: formatAuthError(error) };
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: formatAuthError(err) };
  }
}

export async function signOut() {
  if (!isSupabaseConfigured || !supabase) return { ok: true };
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { ok: false, error: formatAuthError(error) };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: formatAuthError(err) };
  }
}

export async function getSession() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data?.session ?? null;
  } catch {
    return null;
  }
}

export async function getUser() {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export function onAuthStateChange(callback) {
  if (!isSupabaseConfigured || !supabase) {
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => {
    data?.subscription?.unsubscribe();
  };
}
