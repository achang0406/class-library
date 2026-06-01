/** Strip to 10- or 13-digit ISBN (handles scanned EAN-13 with optional prefix). */
export function normalizeIsbn(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 13) return digits;
  if (digits.length === 12 && digits.startsWith('978')) return `0${digits}`;
  return null;
}

export function isValidIsbn10(isbn10) {
  if (!/^\d{9}[\dXx]$/.test(isbn10)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i += 1) sum += (10 - i) * Number(isbn10[i]);
  const check = isbn10[9].toUpperCase() === 'X' ? 10 : Number(isbn10[9]);
  return (sum + check) % 11 === 0;
}

export function isValidIsbn13(isbn13) {
  if (!/^\d{13}$/.test(isbn13)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i += 1) sum += Number(isbn13[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return check === Number(isbn13[12]);
}

export function isValidIsbn(isbn) {
  if (isbn.length === 10) return isValidIsbn10(isbn);
  if (isbn.length === 13) return isValidIsbn13(isbn);
  return false;
}

/** Pull a valid ISBN from OCR or pasted text (requires checksum match). */
export function extractIsbnFromText(text) {
  if (!text?.trim()) return null;

  const candidates = new Set();

  for (const match of text.matchAll(/ISBN(?:[-\s]*(?:1[03])?)?[:\s-]*([0-9Xx-]{10,22})/gi)) {
    const normalized = normalizeIsbn(match[1]);
    if (normalized && isValidIsbn(normalized)) candidates.add(normalized);
  }

  for (const match of text.matchAll(/\b97[89][\d\s-]{10,16}\d\b/g)) {
    const normalized = normalizeIsbn(match[0]);
    if (normalized && isValidIsbn(normalized)) candidates.add(normalized);
  }

  for (const match of text.matchAll(/\b\d{9}[\dXx]\b/g)) {
    const normalized = normalizeIsbn(match[0]);
    if (normalized && isValidIsbn(normalized)) candidates.add(normalized);
  }

  return candidates.values().next().value ?? null;
}
