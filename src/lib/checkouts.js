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

export async function checkoutBook({ bookId, borrowerName, borrowerType }) {
  const client = requireClient();

  const active = await getActiveCheckoutForBook(bookId);
  if (active) throw new Error('This book is already checked out.');

  const { data: checkout, error: checkoutError } = await client
    .from('checkouts')
    .insert({
      book_id: bookId,
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
