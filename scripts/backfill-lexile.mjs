import dotenv from 'dotenv';
import { createSupabaseClient } from './supabase-client.mjs';
import { lookupOpenLibraryLexile } from '../src/lib/openLibrary.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createSupabaseClient();

async function main() {
  const { data: books, error } = await supabase
    .from('books')
    .select('id, title, isbn, open_library_key, lexile')
    .is('lexile', null);

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  if (!books.length) {
    console.log('No books need Lexile backfill.');
    return;
  }

  console.log(`Backfilling Lexile for ${books.length} book(s)…`);

  let updated = 0;
  let skipped = 0;

  for (const book of books) {
    if (!book.isbn && !book.open_library_key) {
      skipped += 1;
      continue;
    }

    try {
      const match = await lookupOpenLibraryLexile({
        isbn: book.isbn,
        openLibraryKey: book.open_library_key,
      });

      if (!match) {
        console.log(`  — ${book.title}: no Lexile in Open Library`);
        skipped += 1;
        continue;
      }

      const { error: updateError } = await supabase
        .from('books')
        .update({ lexile: match.lexile, reading_level: match.readingLevel })
        .eq('id', book.id);

      if (updateError) throw updateError;

      console.log(
        `  ✓ ${book.title}: ${match.lexile}L${match.readingLevel ? ` · ${match.readingLevel}` : ''}`,
      );
      updated += 1;
    } catch (err) {
      console.error(`  ! ${book.title}: ${err.message ?? err}`);
      skipped += 1;
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`Done. Updated ${updated}, skipped ${skipped}.`);
}

main();
