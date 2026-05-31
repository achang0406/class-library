import { useMemo, useState } from 'react';
import { Input } from '../components/ui/Input.jsx';
import { Select } from '../components/ui/Select.jsx';
import { Spinner } from '../components/ui/Spinner.jsx';
import { Stack } from '../components/ui/Stack.jsx';
import { Text } from '../components/ui/Text.jsx';
import { BookGrid } from '../components/books/BookGrid.jsx';
import { SupabaseBanner } from '../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { useBooks } from '../hooks/useBooks.js';
import { GENRES } from '../constants/genres.js';

export default function BrowsePage() {
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('all');
  const [status, setStatus] = useState('all');

  const filters = useMemo(() => ({ search, genre, status }), [search, genre, status]);

  const { books, loading, error } = useBooks(filters);

  return (
    <PageContainer>
      <Stack gap="var(--space-4)">
        <SupabaseBanner />
        <Input
          label="Search"
          placeholder="Title, author, or barcode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Stack gap="var(--space-3)" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Select
            label="Genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">All genres</option>
            {GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </Select>
          <Select
            label="Availability"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ flex: 1 }}
          >
            <option value="all">All</option>
            <option value="available">Available</option>
            <option value="checked_out">Checked out</option>
          </Select>
        </Stack>
        {loading ? (
          <Stack align="center" style={{ padding: 'var(--space-6)' }}>
            <Spinner />
          </Stack>
        ) : null}
        {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
        {!loading && !error && books.length === 0 ? (
          <Text style={{ color: 'var(--color-text-muted)' }}>No books found.</Text>
        ) : null}
        {!loading && books.length > 0 ? <BookGrid books={books} /> : null}
      </Stack>
    </PageContainer>
  );
}
