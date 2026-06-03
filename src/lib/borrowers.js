import { supabase, isSupabaseConfigured } from './supabase.js';

function requireClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured. Add credentials to .env.local');
  }
  return supabase;
}

export async function getBorrowerById(id) {
  const client = requireClient();
  const { data, error } = await client.from('borrowers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function listBorrowers({ type, activeOnly = true } = {}) {
  const client = requireClient();
  let query = client.from('borrowers').select('*').order('display_name', { ascending: true });
  if (type) query = query.eq('borrower_type', type);
  if (activeOnly) query = query.eq('active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createBorrower({ displayName, borrowerType }) {
  const client = requireClient();
  const { data, error } = await client
    .from('borrowers')
    .insert({ display_name: displayName, borrower_type: borrowerType })
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function updateBorrower(id, payload) {
  const client = requireClient();
  const { data, error } = await client
    .from('borrowers')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function bulkCreateBorrowers(rows) {
  if (!rows.length) return [];
  const client = requireClient();
  const { data, error } = await client
    .from('borrowers')
    .insert(
      rows.map((row) => ({
        display_name: row.displayName,
        borrower_type: row.borrowerType,
      })),
    )
    .select('*');
  if (error) throw error;
  return data ?? [];
}

export async function deactivateBorrower(id) {
  return updateBorrower(id, { active: false });
}
