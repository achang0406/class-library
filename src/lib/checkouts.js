import { supabase, isSupabaseConfigured } from './supabase.js';
import { getOverdueDays, daysSince } from './settings.js';

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }
  return supabase;
}

export async function getActiveCheckoutForBook(bookId) {
  const client = requireClient();
  const { data, error } = await client
    .from('checkouts')
    .select('*')
    .eq('book_id', bookId)
    .is('returned_at', null)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function checkoutDuration(checkout) {
  if (!checkout?.checked_out_at) return 0;
  const end = checkout.returned_at ? new Date(checkout.returned_at) : new Date();
  const ms = end.getTime() - new Date(checkout.checked_out_at).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function sortByCount(counts, limit) {
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

export function computeStudentStats(checkouts) {
  const completed = checkouts.filter((c) => c.returned_at);
  const active = checkouts.filter((c) => !c.returned_at);

  const genreCounts = {};
  const authorCounts = {};
  const bookCounts = {};

  for (const c of completed) {
    const book = c.books;
    if (book?.genre) genreCounts[book.genre] = (genreCounts[book.genre] ?? 0) + 1;
    if (book?.author) authorCounts[book.author] = (authorCounts[book.author] ?? 0) + 1;
    bookCounts[c.book_id] = (bookCounts[c.book_id] ?? 0) + 1;
  }

  const durations = completed.map((c) => checkoutDuration(c));
  const avgDaysOut = durations.length
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;

  return {
    totalCheckouts: checkouts.length,
    booksCompleted: completed.length,
    currentLoans: active.length,
    avgDaysOut,
    repeatCheckouts: Object.values(bookCounts).filter((n) => n > 1).length,
    topGenres: sortByCount(genreCounts, 3),
    topAuthors: sortByCount(authorCounts, 3),
    borrowedBookIds: new Set(checkouts.map((c) => c.book_id)),
    lastCheckoutAt: checkouts[0]?.checked_out_at ?? null,
  };
}

export async function listCheckoutHistory({ borrowerId, includeActive = true } = {}) {
  const client = requireClient();
  let query = client
    .from('checkouts')
    .select('*, books(*)')
    .eq('borrower_id', borrowerId)
    .order('checked_out_at', { ascending: false });

  if (!includeActive) {
    query = query.not('returned_at', 'is', null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getStudentReadingStats(borrowerId) {
  const history = await listCheckoutHistory({ borrowerId });
  return computeStudentStats(history);
}

export async function getBookCheckoutCounts() {
  const client = requireClient();
  const { data, error } = await client.from('checkouts').select('book_id');
  if (error) throw error;

  const counts = {};
  for (const row of data ?? []) {
    counts[row.book_id] = (counts[row.book_id] ?? 0) + 1;
  }
  return counts;
}

export async function checkoutBook({ bookId, borrowerId, borrowerName, borrowerType }) {
  const client = requireClient();

  const active = await getActiveCheckoutForBook(bookId);
  if (active) throw new Error('This book is already checked out.');

  const { data: checkout, error: checkoutError } = await client
    .from('checkouts')
    .insert({
      book_id: bookId,
      borrower_id: borrowerId ?? null,
      borrower_name: borrowerName,
      borrower_type: borrowerType,
    })
    .select('*')
    .single();
  if (checkoutError) throw checkoutError;

  const { error: bookError } = await client
    .from('books')
    .update({ status: 'checked_out' })
    .eq('id', bookId);
  if (bookError) throw bookError;

  return checkout;
}

export async function returnBook(bookId) {
  const client = requireClient();
  const active = await getActiveCheckoutForBook(bookId);
  if (!active) throw new Error('This book is not checked out.');

  const { data, error } = await client
    .from('checkouts')
    .update({ returned_at: new Date().toISOString() })
    .eq('id', active.id)
    .select('*')
    .single();
  if (error) throw error;

  const { error: bookError } = await client
    .from('books')
    .update({ status: 'available' })
    .eq('id', bookId);
  if (bookError) throw bookError;

  return data;
}

export async function listActiveCheckouts() {
  const client = requireClient();
  const { data, error } = await client
    .from('checkouts')
    .select('*, books(*)')
    .is('returned_at', null)
    .order('checked_out_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listOverdueCheckouts({ borrowerType } = {}) {
  const threshold = getOverdueDays();
  const checkouts = await listActiveCheckouts();
  return checkouts.filter((c) => {
    if (borrowerType === 'student' && c.borrower_type !== 'student') return false;
    if (borrowerType === 'staff' && !['staff', 'guest'].includes(c.borrower_type)) return false;
    return daysSince(c.checked_out_at) > threshold;
  });
}

export function enrichCheckout(checkout) {
  return {
    ...checkout,
    daysOut: daysSince(checkout.checked_out_at),
  };
}
