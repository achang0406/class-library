import dotenv from 'dotenv';
import { createSupabaseClient } from './supabase-client.mjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createSupabaseClient();

const SAMPLE_BOOKS = [
  {
    title: 'The Very Hungry Caterpillar',
    author: 'Eric Carle',
    genre: 'Picture Book',
    cover_url: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    publish_year: 1969,
    status: 'available',
  },
  {
    title: "Charlotte's Web",
    author: 'E.B. White',
    genre: 'Fiction',
    cover_url: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    publish_year: 1952,
    status: 'available',
  },
  {
    title: 'Where the Wild Things Are',
    author: 'Maurice Sendak',
    genre: 'Picture Book',
    cover_url: 'https://covers.openlibrary.org/b/id/8662839-L.jpg',
    publish_year: 1963,
    status: 'available',
  },
  {
    title: 'Goodnight Moon',
    author: 'Margaret Wise Brown',
    genre: 'Picture Book',
    cover_url: 'https://covers.openlibrary.org/b/id/8739161-L.jpg',
    publish_year: 1947,
    status: 'available',
  },
];

const SAMPLE_BORROWERS = [
  { display_name: 'Maya', borrower_type: 'student' },
  { display_name: 'Jordan', borrower_type: 'student' },
  { display_name: 'Sam', borrower_type: 'student' },
  { display_name: 'Ava', borrower_type: 'student' },
  { display_name: 'Mrs. Johnson', borrower_type: 'staff' },
  { display_name: 'Reading Aide', borrower_type: 'staff' },
];

async function main() {
  const { data: existingBooks } = await supabase.from('books').select('id').limit(1);
  if (existingBooks?.length) {
    console.log('Books already exist — skipping seed.');
    return;
  }

  for (const book of SAMPLE_BOOKS) {
    const { error } = await supabase.from('books').insert({ ...book, barcode: '' });
    if (error) throw error;
  }

  const { error: borrowerError } = await supabase.from('borrowers').insert(SAMPLE_BORROWERS);
  if (borrowerError) throw borrowerError;

  console.log(`Seeded ${SAMPLE_BOOKS.length} books and ${SAMPLE_BORROWERS.length} borrowers.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
