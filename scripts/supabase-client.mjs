import { createClient } from "@supabase/supabase-js";

export function getSupabaseDbSchema() {
  return (
    process.env.VITE_SUPABASE_DB_SCHEMA ||
    process.env.SUPABASE_DB_SCHEMA ||
    "public"
  );
}

export function createSupabaseClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const schema = getSupabaseDbSchema();

  if (!url || !key) {
    throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY");
  }

  return createClient(url, key, {
    db: { schema },
  });
}
