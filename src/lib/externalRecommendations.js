import { listBooks } from './books.js';
import { getStudentReadingStats } from './checkouts.js';
import { searchOpenLibraryByAuthor, searchOpenLibraryByGenre } from './openLibrary.js';

function isInLibrary(doc, { ownedIsbns, ownedOlKeys }) {
  if (doc.isbn && ownedIsbns.has(doc.isbn)) return true;
  if (doc.openLibraryKey && ownedOlKeys.has(doc.openLibraryKey)) return true;
  return false;
}

function scoreExternal({ doc, stats }) {
  let score = 0;
  let reason = 'Explore beyond our library';

  const topGenres = stats.topGenres.map((g) => g.label);
  const topAuthors = stats.topAuthors.map((a) => a.label);

  if (doc.genre && topGenres.includes(doc.genre)) {
    score += 3;
    reason = `More ${doc.genre} to explore`;
  } else if (doc.author && topAuthors.some((a) => doc.author.includes(a.split(',')[0]))) {
    score += 2;
    reason = `More from ${doc.author.split(',')[0]}`;
  }

  return { ...doc, score, reason };
}

export async function getExternalRecommendationsForStudent(borrowerId, { limit = 8 } = {}) {
  const [stats, libraryBooks] = await Promise.all([
    getStudentReadingStats(borrowerId),
    listBooks(),
  ]);

  const ownedIsbns = new Set(libraryBooks.filter((b) => b.isbn).map((b) => b.isbn));
  const ownedOlKeys = new Set(
    libraryBooks.filter((b) => b.open_library_key).map((b) => b.open_library_key),
  );
  const owned = { ownedIsbns, ownedOlKeys };

  const searches = [];

  for (const genre of stats.topGenres.slice(0, 2)) {
    searches.push(searchOpenLibraryByGenre(genre.label, { limit: 6 }));
  }
  for (const author of stats.topAuthors.slice(0, 2)) {
    searches.push(searchOpenLibraryByAuthor(author.label, { limit: 6 }));
  }

  if (searches.length === 0) {
    searches.push(searchOpenLibraryByGenre('Fiction', { limit: 8 }));
  }

  const resultSets = await Promise.all(searches);
  const seen = new Set();

  const candidates = [];
  for (const results of resultSets) {
    for (const doc of results) {
      const key = doc.openLibraryKey ?? doc.isbn ?? doc.title;
      if (seen.has(key) || isInLibrary(doc, owned)) continue;
      seen.add(key);
      candidates.push(scoreExternal({ doc, stats }));
    }
  }

  return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
}
