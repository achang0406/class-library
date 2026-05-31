import { supabase, isSupabaseConfigured } from './supabase.js';

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }
  return supabase;
}

export async function listBooks({ search, genre, status, needsLabel } = {}) {
  const client = requireClient();
  let query = client.from('books').select('*').order('title', { ascending: true });

  if (genre && genre !== 'all') query = query.eq('genre', genre);
  if (status && status !== 'all') query = query.eq('status', status);
  if (needsLabel) query = query.is('label_printed_at', null);
  if (search?.trim()) {
    const s = search.trim();
    query = query.or(`title.ilike.%${s}%,author.ilike.%${s}%,barcode.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getBookById(id) {
  const client = requireClient();
  const { data, error } = await client.from('books').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getBookByBarcode(barcode) {
  const client = requireClient();
  const { data, error } = await client
    .from('books')
    .select('*')
    .eq('barcode', barcode.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function findDuplicateBook({ isbn, openLibraryKey }) {
  const client = requireClient();
  if (isbn) {
    const { data } = await client.from('books').select('id, title').eq('isbn', isbn).maybeSingle();
    if (data) return data;
  }
  if (openLibraryKey) {
    const { data } = await client
      .from('books')
      .select('id, title')
      .eq('open_library_key', openLibraryKey)
      .maybeSingle();
    if (data) return data;
  }
  return null;
}

export async function createBook(payload) {
  const client = requireClient();
  const { data, error } = await client
    .from('books')
    .insert({ ...payload, barcode: '' })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateBook(id, payload) {
  const client = requireClient();
  const { data, error } = await client
    .from('books')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function markLabelsPrinted(bookIds) {
  const client = requireClient();
  const { error } = await client
    .from('books')
    .update({ label_printed_at: new Date().toISOString() })
    .in('id', bookIds);
  if (error) throw error;
}

export async function getBookStats() {
  const client = requireClient();
  const { data, error } = await client.from('books').select('status');
  if (error) throw error;
  const total = data.length;
  const checkedOut = data.filter((b) => b.status === 'checked_out').length;
  return { total, checkedOut, available: total - checkedOut };
}

export async function bulkCreateBooks(rows) {
  const client = requireClient();
  const { data, error } = await client
    .from('books')
    .insert(rows.map((r) => ({ ...r, barcode: '' })))
    .select('*');
  if (error) throw error;
  return data ?? [];
}

export async function getBooksByIds(ids) {
  if (!ids?.length) return [];
  const client = requireClient();
  const { data, error } = await client.from('books').select('*').in('id', ids).order('title');
  if (error) throw error;
  return data ?? [];
}
