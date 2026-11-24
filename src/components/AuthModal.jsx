import { useRef, useState } from "react";
import { Eye, EyeOff, Loader2, LogIn, UserPlus } from "lucide-react";
import Modal from "./Modal.jsx";
import Field from "./Field.jsx";
import { describedBy } from "../utils/formHelpers.js";
import { signIn, signUp } from "../services/authService.js";

export default function AuthModal({ onClose, onSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const formRef = useRef(null);

  function clearFieldError(field) {
    setServerError(null);
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const cleanEmail = email.trim();
    const errors = {};
    if (!cleanEmail) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      errors.email = "Format email tidak valid.";
    }

    if (!password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (isRegister && password.length < 6) {
      errors.password = "Kata sandi minimal 6 karakter.";
    }

    if (isRegister && password !== confirmPassword) {
      errors.confirmPassword = "Konfirmasi kata sandi tidak cocok.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }

    setFieldErrors({});
    setLoading(true);

    if (isRegister) {
      const res = await signUp({ email: cleanEmail, password });
      setLoading(false);

      if (!res.ok) {
        setServerError(res.error);
        return;
      }

      const needsEmailConfirm = !res.data?.session;
      const message = needsEmailConfirm
        ? "Pendaftaran berhasil. Periksa kotak masuk email Anda untuk konfirmasi sebelum masuk."
        : "Pendaftaran berhasil! Akun cloud Anda kini aktif.";
      onSuccess(res.data?.user || res.data?.session?.user, message);
      onClose();
    } else {
      const res = await signIn({ email: cleanEmail, password });
      setLoading(false);

      if (!res.ok) {
        setServerError(res.error);
        return;
      }

      onSuccess(res.data?.user || res.data?.session?.user, "Berhasil masuk ke akun cloud Anda.");
      onClose();
    }
  }

  return (
    <Modal title={isRegister ? "Daftar Akun Cloud" : "Masuk ke Akun Cloud"} onClose={onClose}>
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {serverError ? (
          <div role="alert" className="rounded-lg border border-expense/20 bg-expense-soft p-3 text-sm text-expense">
            {serverError}
          </div>
        ) : null}

        <Field id="auth-email" label="Alamat Email" error={fieldErrors.email}>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            placeholder="nama@contoh.com"
            className="input"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={describedBy("auth-email", fieldErrors.email)}
            disabled={loading}
          />
        </Field>

        <Field id="auth-password" label="Kata Sandi" error={fieldErrors.password}>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? "text" : "password"}
              autoComplete={isRegister ? "new-password" : "current-password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError("password");
              }}
              placeholder="Minimal 6 karakter"
              className="input pr-12"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={describedBy("auth-password", fieldErrors.password)}
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="btn-icon absolute top-0 right-0"
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              disabled={loading}
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={1.75} aria-hidden="true" />
              ) : (
                <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
              )}
            </button>
          </div>
        </Field>

        {isRegister ? (
          <Field id="auth-confirm-password" label="Ulangi Kata Sandi" error={fieldErrors.confirmPassword}>
            <input
              id="auth-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearFieldError("confirmPassword");
              }}
              placeholder="Masukkan ulang kata sandi"
              className="input"
              aria-invalid={Boolean(fieldErrors.confirmPassword)}
              aria-describedby={describedBy("auth-confirm-password", fieldErrors.confirmPassword)}
              disabled={loading}
            />
          </Field>
        ) : null}

        <div className="mt-2 flex flex-col gap-2">
          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
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
              setFieldErrors({});
              setServerError(null);
            }}
            className="min-h-11 rounded-lg px-2 text-center text-sm font-medium text-brand hover:underline"
          >
            {isRegister ? "Sudah punya akun? Masuk di sini" : "Belum punya akun? Buat akun sekarang"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
