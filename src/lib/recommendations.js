import { listBooks } from './books.js';
import {
  listCheckoutHistory,
  getStudentReadingStats,
  getBookCheckoutCounts,
} from './checkouts.js';

function scoreBook({ book, stats, popularityCounts, maxPopularity }) {
  if (stats.borrowedBookIds.has(book.id)) return null;

  let score = 0;
  let reason = null;

  const topGenreLabels = stats.topGenres.map((g) => g.label);
  const topAuthorLabels = stats.topAuthors.map((a) => a.label);

  if (book.genre && topGenreLabels.includes(book.genre)) {
    score += 3;
    reason = `Because you enjoy ${book.genre}`;
  } else if (book.author && topAuthorLabels.includes(book.author)) {
    score += 2;
    reason = `More from ${book.author}`;
  }

  const pop = popularityCounts[book.id] ?? 0;
  if (maxPopularity > 0) {
    score += pop / maxPopularity;
  }

  if (!reason && pop > 0) {
    reason = 'Popular in our library';
  } else if (!reason) {
    reason = 'Available now';
  }

  return { book, score, reason };
}

export async function getRecommendationsForStudent(borrowerId, { limit = 8 } = {}) {
  const [stats, availableBooks, popularityCounts] = await Promise.all([
    getStudentReadingStats(borrowerId),
    listBooks({ status: 'available' }),
    getBookCheckoutCounts(),
  ]);

  const maxPopularity = Math.max(1, ...Object.values(popularityCounts));

  const sparseHistory = stats.booksCompleted < 2;

  const scored = availableBooks
    .map((book) => scoreBook({ book, stats, popularityCounts, maxPopularity }))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (sparseHistory) {
    const popularFallback = availableBooks
      .map((book) => ({
        book,
        score: popularityCounts[book.id] ?? 0,
        reason: 'Popular in our library',
      }))
      .filter((item) => !stats.borrowedBookIds.has(item.book.id))
      .sort((a, b) => b.score - a.score);

    return popularFallback.slice(0, limit);
  }

  return scored.slice(0, limit);
}

export async function getStudentRecommendationContext(borrowerId) {
  const [history, stats, recommendations] = await Promise.all([
    listCheckoutHistory({ borrowerId }),
    getStudentReadingStats(borrowerId),
    getRecommendationsForStudent(borrowerId),
  ]);

  return { history, stats, recommendations };
}
