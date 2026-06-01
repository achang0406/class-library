/**
 * K-12 grade bands from typical student Lexile ranges (high → low).
 * When ranges overlap, the higher grade wins (e.g. 680L → 3rd Grade).
 */
export const LEXILE_GRADE_BANDS = [
  { label: '11th–12th Grade', min: 1295, max: 1610 },
  { label: '10th Grade', min: 1250, max: 1570 },
  { label: '9th Grade', min: 1205, max: 1520 },
  { label: '8th Grade', min: 1155, max: 1470 },
  { label: '7th Grade', min: 1095, max: 1410 },
  { label: '6th Grade', min: 1030, max: 1340 },
  { label: '5th Grade', min: 950, max: 1260 },
  { label: '4th Grade', min: 850, max: 1160 },
  { label: '3rd Grade', min: 645, max: 985 },
  { label: '2nd Grade', min: 425, max: 795 },
  { label: '1st Grade', min: 165, max: 570 },
  { label: 'Kindergarten', min: -160, max: 150 },
];

/** @param {unknown} raw Open Library lexile array/number/string */
export function normalizeLexile(raw) {
  if (raw == null) return null;

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round(value);

  const text = String(value).trim().toUpperCase();
  if (!text) return null;

  const br = /^BR(\d+)L?$/.exec(text);
  if (br) return -parseInt(br[1], 10);

  const measure = /^(\d+)L?$/.exec(text);
  if (measure) return parseInt(measure[1], 10);

  return null;
}

/** @param {number | null | undefined} lexile */
export function lexileToGradeLevel(lexile) {
  if (lexile == null || Number.isNaN(lexile)) return null;

  if (lexile > 1610) return '11th–12th Grade';

  for (const band of LEXILE_GRADE_BANDS) {
    if (lexile >= band.min && lexile <= band.max) return band.label;
  }

  return null;
}

/** @param {number | null | undefined} lexile */
export function formatLexile(lexile) {
  if (lexile == null || Number.isNaN(lexile)) return null;
  if (lexile < 0) return `BR${Math.abs(Math.round(lexile))}L`;
  return `${Math.round(lexile)}L`;
}

/** @param {number | null | undefined} lexile */
export function readingLevelFromLexile(lexile) {
  return lexileToGradeLevel(normalizeLexile(lexile) ?? lexile);
}

/** @param {number[]} scores */
export function averageLexileFromScores(scores) {
  const valid = scores.filter((v) => v != null && Number.isFinite(v));
  if (!valid.length) return null;
  const avg = Math.round(valid.reduce((sum, n) => sum + n, 0) / valid.length);
  return {
    avgLexile: avg,
    avgLexileLabel: formatLexile(avg),
    avgLexileGrade: lexileToGradeLevel(avg),
    count: valid.length,
  };
}

/** @param {Array<{ returned_at?: string | null, books?: { lexile?: number | null } | null }>} checkouts */
export function averageLexileFromCheckouts(checkouts, { completedOnly = true } = {}) {
  const rows = completedOnly ? checkouts.filter((c) => c.returned_at) : checkouts;
  return averageLexileFromScores(rows.map((c) => c.books?.lexile));
}

/** @param {{ lexile?: number | null, reading_level?: string | null }} book */
export function resolveBookReadingDisplay(book) {
  const lexile = book?.lexile ?? null;
  const readingLevel = book?.reading_level ?? lexileToGradeLevel(lexile);
  return {
    lexile,
    readingLevel,
    lexileLabel: formatLexile(lexile),
  };
}
