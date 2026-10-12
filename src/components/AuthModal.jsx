import { useState } from "react";
import { LogIn, UserPlus, Loader2 } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { signIn, signUp } from "../services/authService.js";

export default function AuthModal({ onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError("Email wajib diisi.");
      return;
    }
    if (!password) {
      setError("Kata sandi wajib diisi.");
      return;
    }

    if (isRegister) {
      if (password.length < 6) {
        setError("Kata sandi minimal terdiri dari 6 karakter.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Konfirmasi kata sandi tidak cocok.");
        return;
      }

      setLoading(true);
      const res = await signUp({ email: cleanEmail, password });
      setLoading(false);

      if (!res.ok) {
        setError(res.error);
        return;
      }

      onSuccess(res.data?.user || res.data?.session?.user, "Pendaftaran berhasil!");
      onClose();
    } else {
      setLoading(true);
      const res = await signIn({ email: cleanEmail, password });
      setLoading(false);

      if (!res.ok) {
        setError(res.error);
        return;
      }

      onSuccess(res.data?.user || res.data?.session?.user, "Berhasil masuk ke akun Anda.");
      onClose();
    }
  }

  return (
    <Modal
      title={isRegister ? "Daftar Akun Cloud" : "Masuk ke Akun Cloud"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {error ? (
          <div
            role="alert"
            className="rounded-lg border border-expense/20 bg-expense-soft p-3 text-sm text-expense"
          >
            {error}
          </div>
        ) : null}

        <Field id="auth-email" label="Alamat Email">
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@contoh.com"
            className="input"
            disabled={loading}
          />
        </Field>

        <Field id="auth-password" label="Kata Sandi">
          <input
            id="auth-password"
            type="password"
            autoComplete={isRegister ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimal 6 karakter"
            className="input"
            disabled={loading}
          />
        </Field>

        {isRegister ? (
          <Field id="auth-confirm-password" label="Ulangi Kata Sandi">
            <input
              id="auth-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Masukkan ulang kata sandi"
              className="input"
              disabled={loading}
            />
          </Field>
        ) : null}

        <div className="mt-2 flex flex-col gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                Memproses...
              </>
            ) : isRegister ? (
              <>
                <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
                Daftar Akun
              </>
            ) : (
              <>
                <LogIn size={18} strokeWidth={2} aria-hidden="true" />
                Masuk
              </>
            )}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-center text-sm font-medium text-brand hover:underline"
          >
            {isRegister
              ? "Sudah punya akun? Masuk di sini"
              : "Belum punya akun? Buat akun sekarang"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
