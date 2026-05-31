import { mapSubjectsToGenre } from './genreMap.js';

const FIELDS = 'key,title,author_name,cover_i,first_publish_year,isbn,subject';
const CACHE = new Map();

function coverUrl(coverId) {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : null;
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
