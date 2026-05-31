export const GENRES = [
  'Picture Book',
  'Fiction',
  'Non-Fiction',
  'Biography',
  'Poetry',
  'Graphic Novel',
  'Reference',
  'Other',
];

const GENRE_KEYWORDS = [
  { genre: 'Picture Book', keywords: ['picture book', 'picture books', 'board book'] },
  { genre: 'Biography', keywords: ['biography', 'biographies', 'autobiograph'] },
  { genre: 'Poetry', keywords: ['poetry', 'poems'] },
  { genre: 'Graphic Novel', keywords: ['graphic novel', 'comics'] },
  { genre: 'Reference', keywords: ['reference', 'encyclopedia', 'dictionary'] },
  { genre: 'Non-Fiction', keywords: ['non-fiction', 'nonfiction', 'juvenile nonfiction'] },
  { genre: 'Fiction', keywords: ['fiction', 'juvenile fiction', 'fantasy', 'mystery'] },
];

export function mapSubjectsToGenre(subjects = []) {
  const joined = subjects.join(' ').toLowerCase();
  for (const { genre, keywords } of GENRE_KEYWORDS) {
    if (keywords.some((k) => joined.includes(k))) return genre;
  }
  return 'Other';
}

export const DEFAULT_OVERDUE_DAYS = 14;
