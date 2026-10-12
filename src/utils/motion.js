// Animasi grafik dimatikan jika pengguna meminta gerakan dikurangi.
export function shouldAnimate() {
  return typeof window !== "undefined" && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
