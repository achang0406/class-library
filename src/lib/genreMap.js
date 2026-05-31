import { GENRES } from '../constants/genres.js';

const KEYWORD_MAP = [
  ['picture book', 'Picture Book'],
  ['picture books', 'Picture Book'],
  ['juvenile fiction', 'Fiction'],
  ['fiction', 'Fiction'],
  ['nonfiction', 'Non-Fiction'],
  ['non-fiction', 'Non-Fiction'],
  ['biography', 'Biography'],
  ['autobiograph', 'Biography'],
  ['poetry', 'Poetry'],
  ['poems', 'Poetry'],
  ['graphic novel', 'Graphic Novel'],
  ['comics', 'Graphic Novel'],
  ['reference', 'Reference'],
  ['encyclopedia', 'Reference'],
];

export function mapSubjectsToGenre(subjects = []) {
  const joined = subjects.join(' ').toLowerCase();
  for (const [keyword, genre] of KEYWORD_MAP) {
    if (joined.includes(keyword)) return genre;
  }
  return 'Fiction';
}

export function normalizeGenre(value) {
  if (GENRES.includes(value)) return value;
  return mapSubjectsToGenre([value ?? '']);
}
