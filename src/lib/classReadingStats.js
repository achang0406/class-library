import { listBorrowers } from './borrowers.js';
import { listBooks } from './books.js';
import { computeStudentStats, getBookCheckoutCounts } from './checkouts.js';
import { daysSince } from './settings.js';
import { supabase, isSupabaseConfigured } from './supabase.js';

const INACTIVE_DAYS = 14;

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }
  return supabase;
}

async function listStudentCheckoutsWithBooks() {
  const client = requireClient();
  const { data, error } = await client
    .from('checkouts')
    .select('*, books(*)')
    .eq('borrower_type', 'student')
    .not('borrower_id', 'is', null)
    .order('checked_out_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

function groupCheckoutsByBorrower(checkouts) {
  const byBorrower = new Map();
  for (const checkout of checkouts) {
    const id = checkout.borrower_id;
    if (!byBorrower.has(id)) byBorrower.set(id, []);
    byBorrower.get(id).push(checkout);
  }
  return byBorrower;
}

function buildGenreBreakdown(checkouts) {
  const counts = {};
  for (const checkout of checkouts) {
    if (!checkout.returned_at) continue;
    const genre = checkout.books?.genre;
    if (!genre) continue;
    counts[genre] = (counts[genre] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count }));
}

async function buildPopularBooks(limit = 8) {
  const [books, counts] = await Promise.all([listBooks(), getBookCheckoutCounts()]);
  return books
    .map((book) => ({ book, count: counts[book.id] ?? 0 }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getClassReadingReport({ inactiveDays = INACTIVE_DAYS } = {}) {
  const [students, checkouts] = await Promise.all([
    listBorrowers({ type: 'student' }),
    listStudentCheckoutsWithBooks(),
  ]);

  const byBorrower = groupCheckoutsByBorrower(checkouts);
  const completedCheckouts = checkouts.filter((c) => c.returned_at);

  const studentRows = students.map((student) => {
    const history = byBorrower.get(student.id) ?? [];
    const stats = computeStudentStats(history);
    const daysSinceLast =
      stats.lastCheckoutAt != null ? daysSince(stats.lastCheckoutAt) : null;
    const inactive =
      stats.lastCheckoutAt == null || (daysSinceLast != null && daysSinceLast > inactiveDays);

    return {
      id: student.id,
      name: student.display_name,
      stats,
      daysSinceLast,
      inactive,
      topGenre: stats.topGenres[0]?.label ?? null,
    };
  });

  studentRows.sort((a, b) => b.stats.booksCompleted - a.stats.booksCompleted);

  const activeReaders = studentRows.filter((row) => !row.inactive).length;
  const totalBooksRead = studentRows.reduce((sum, row) => sum + row.stats.booksCompleted, 0);
  const currentlyOut = studentRows.reduce((sum, row) => sum + row.stats.currentLoans, 0);

  const popularBooks = await buildPopularBooks();
  const genreBreakdown = buildGenreBreakdown(completedCheckouts);
  const inactiveStudents = studentRows.filter((row) => row.inactive);

  return {
    summary: {
      studentCount: students.length,
      activeReaders,
      inactiveReaders: inactiveStudents.length,
      totalBooksRead,
      currentlyOut,
      inactiveDays,
    },
    students: studentRows,
    inactiveStudents,
    popularBooks,
    genreBreakdown,
  };
}
