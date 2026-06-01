import { mapSubjectsToGenre, GENRE_SEARCH_TERMS } from './genreMap.js';
import { normalizeLexile, readingLevelFromLexile } from './lexile.js';
import { normalizeIsbn } from './isbn.js';

export { normalizeIsbn } from './isbn.js';

const FIELDS = 'key,title,author_name,cover_i,first_publish_year,isbn,subject,lexile';
const CACHE = new Map();

function coverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
}

export function mapOpenLibraryDoc(doc) {
  const authors = doc.author_name ?? [];
  const lexile = normalizeLexile(doc.lexile);
  return {
    openLibraryKey: doc.key ?? null,
    title: doc.title ?? '',
    author: authors.join(', ') || null,
    coverUrl: coverUrl(doc.cover_i),
    publishYear: doc.first_publish_year ?? null,
    isbn: doc.isbn?.[0] ?? null,
    genre: mapSubjectsToGenre(doc.subject ?? []),
    subjects: doc.subject ?? [],
    lexile,
    readingLevel: readingLevelFromLexile(lexile),
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

/** Fetch Lexile + grade for a book when Open Library has it (ISBN or work key). */
export async function lookupOpenLibraryLexile({ isbn, openLibraryKey, signal } = {}) {
  if (isbn) {
    const byIsbn = await lookupOpenLibraryByIsbn(isbn, { signal });
    if (byIsbn?.lexile != null) {
      return { lexile: byIsbn.lexile, readingLevel: byIsbn.readingLevel };
    }
  }

  if (openLibraryKey) {
    const params = new URLSearchParams({
      q: `key:${openLibraryKey}`,
      limit: '1',
      fields: 'key,lexile',
    });
    const res = await fetch(`https://openlibrary.org/search.json?${params}`, { signal });
    if (!res.ok) throw new Error('Open Library lookup failed');

    const json = await res.json();
    const lexile = normalizeLexile(json.docs?.[0]?.lexile);
    if (lexile != null) {
      return { lexile, readingLevel: readingLevelFromLexile(lexile) };
    }
  }

  return null;
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

export async function searchOpenLibraryByGenre(genre, { signal, limit = 8 } = {}) {
  const term = GENRE_SEARCH_TERMS[genre] ?? genre;
  return searchOpenLibrary(term, { signal, limit });
}

export async function searchOpenLibraryByAuthor(author, { signal, limit = 8 } = {}) {
  const q = author.trim();
  if (!q) return [];
  return searchOpenLibrary(`author:"${q}"`, { signal, limit });
}
