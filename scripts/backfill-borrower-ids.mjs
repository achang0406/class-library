import dotenv from 'dotenv';
import { createSupabaseClient } from './supabase-client.mjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createSupabaseClient();

async function main() {
  const { data: borrowers, error: borrowersError } = await supabase
    .from('borrowers')
    .select('id, display_name, borrower_type')
    .eq('active', true);

  if (borrowersError) {
    console.error('Failed to load borrowers:', borrowersError.message);
    process.exit(1);
  }

  const nameToId = new Map(
    (borrowers ?? []).map((b) => [`${b.borrower_type}:${b.display_name.toLowerCase()}`, b.id]),
  );

  const { data: checkouts, error: checkoutsError } = await supabase
    .from('checkouts')
    .select('id, borrower_name, borrower_type, borrower_id')
    .is('borrower_id', null);

  if (checkoutsError) {
    console.error('Failed to load checkouts:', checkoutsError.message);
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;

  for (const checkout of checkouts ?? []) {
    const key = `${checkout.borrower_type}:${checkout.borrower_name.toLowerCase()}`;
    const borrowerId = nameToId.get(key);
    if (!borrowerId) {
      skipped += 1;
      continue;
    }

    const { error } = await supabase
      .from('checkouts')
      .update({ borrower_id: borrowerId })
      .eq('id', checkout.id);

    if (error) {
      console.error(`Failed to update checkout ${checkout.id}:`, error.message);
      continue;
    }
    updated += 1;
  }

  console.log(`Backfill complete: ${updated} updated, ${skipped} unmatched (guests or renamed).`);
}

main();
