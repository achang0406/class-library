import { mapSubjectsToGenre } from './genreMap.js';

const FIELDS = 'key,title,author_name,cover_i,first_publish_year,isbn,subject';
const CACHE = new Map();

function coverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

/** Strip to 10- or 13-digit ISBN (handles scanned EAN-13 with optional prefix). */
export function normalizeIsbn(raw) {
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 13) return digits;
  if (digits.length === 12 && digits.startsWith('978')) return `0${digits}`;
  return null;
}

export function mapOpenLibraryDoc(doc) {
  const authors = doc.author_name ?? [];
  return {
    openLibraryKey: doc.key ?? null,
    title: doc.title ?? '',
    author: authors.join(', ') || null,
    coverUrl: coverUrl(doc.cover_i),
    publishYear: doc.first_publish_year ?? null,
    isbn: doc.isbn?.[0] ?? null,
    genre: mapSubjectsToGenre(doc.subject ?? []),
    subjects: doc.subject ?? [],
  };
}

export async function lookupOpenLibraryByIsbn(rawIsbn, { signal } = {}) {
  const isbn = normalizeIsbn(rawIsbn);
  if (!isbn) throw new Error('Not a valid ISBN barcode. Try the lines above the barcode on the back cover.');

  const cacheKey = `isbn:${isbn}`;
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

  const params = new URLSearchParams({
    q: `isbn:${isbn}`,
    limit: '1',
    fields: FIELDS,
  });
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, { signal });
  if (!res.ok) throw new Error('Open Library lookup failed');

  const json = await res.json();
  const doc = json.docs?.[0];
  if (!doc) return null;

  const result = { ...mapOpenLibraryDoc(doc), isbn: doc.isbn?.[0] ?? isbn };
  CACHE.set(cacheKey, result);
  return result;
}

export async function searchOpenLibrary(query, { signal, limit = 8 } = {}) {
  const q = query.trim();
  if (q.length < 3) return [];

  const cacheKey = q.toLowerCase();
  if (CACHE.has(cacheKey)) return CACHE.get(cacheKey);

  const params = new URLSearchParams({ q, limit: String(limit), fields: FIELDS });
  const res = await fetch(`https://openlibrary.org/search.json?${params}`, { signal });
  if (!res.ok) throw new Error('Open Library search failed');

  const json = await res.json();
  const results = (json.docs ?? []).map(mapOpenLibraryDoc);
  CACHE.set(cacheKey, results);
  return results;
}
