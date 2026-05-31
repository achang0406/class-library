import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { BookCover } from '../../components/ui/BookCover.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { useBooks } from '../../hooks/useBooks.js';

export default function TeacherLabelsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('needs');
  const [selected, setSelected] = useState(new Set());

  const filters = useMemo(() => ({ needsLabel: filter === 'needs' }), [filter]);
  const allFilters = useMemo(() => ({}), []);
  const { books: needsBooks, loading: loadingNeeds } = useBooks(filters);
  const { books: allBooks, loading: loadingAll } = useBooks(allFilters);

  const books = filter === 'needs' ? needsBooks : allBooks;
  const loading = filter === 'needs' ? loadingNeeds : loadingAll;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(books.map((b) => b.id)));
  }

  function printSelected() {
    if (!selected.size) return;
    navigate(`/teacher/labels/print?ids=${[...selected].join(',')}`);
  }

  return (
    <PageContainer>
      <Stack gap="var(--space-4)">
        <SupabaseBanner />
        <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
          Each sticker is a 0.8″ QR with LIB- id below. Use the on-screen match list when printing
          to pair stickers with books.
        </Text>
        <Stack gap="var(--space-2)" style={{ flexDirection: 'row' }}>
          <Button
            variant={filter === 'needs' ? 'primary' : 'secondary'}
            onClick={() => {
              setFilter('needs');
              setSelected(new Set());
            }}
          >
            Needs label
          </Button>
          <Button
            variant={filter === 'all' ? 'primary' : 'secondary'}
            onClick={() => {
              setFilter('all');
              setSelected(new Set());
            }}
          >
            All books
          </Button>
        </Stack>
        <Stack gap="var(--space-2)" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={selectAll}>
            Select all
          </Button>
          <Text variant="label">{selected.size} selected</Text>
        </Stack>
        {loading ? <Text>Loading…</Text> : null}
        {!loading && books.length === 0 ? (
          <Text style={{ color: 'var(--color-text-muted)' }}>No books in this list.</Text>
        ) : null}
        <Stack gap="var(--space-2)">
          {books.map((book) => (
            <label
              key={book.id}
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'center',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: selected.has(book.id) ? 'var(--color-surface)' : 'var(--color-card)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(book.id)}
                onChange={() => toggle(book.id)}
              />
              <BookCover src={book.cover_url} alt="" width={40} />
              <Stack gap="var(--space-1)" style={{ flex: 1, minWidth: 0 }}>
                <Text variant="emphasis">{book.title}</Text>
                <Text variant="label">{book.barcode}</Text>
              </Stack>
            </label>
          ))}
        </Stack>
        <Button variant="primary" fullWidth disabled={!selected.size} onClick={printSelected}>
          Print {selected.size || ''} label{selected.size === 1 ? '' : 's'}
        </Button>
      </Stack>
    </PageContainer>
  );
}
