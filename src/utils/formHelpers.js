// Menghubungkan input dengan pesan error atau teks bantuan (aria-describedby).
export function describedBy(id, error, hint) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}
