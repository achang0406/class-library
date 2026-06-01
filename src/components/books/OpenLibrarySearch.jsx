import { useEffect, useState } from 'react';
import { searchOpenLibrary } from '../../lib/openLibrary.js';
import { formatLexile } from '../../lib/lexile.js';
import { BookCover } from '../ui/BookCover.jsx';
import { Input } from '../ui/Input.jsx';
import { Spinner } from '../ui/Spinner.jsx';
import { Stack } from '../ui/Stack.jsx';
import { Text } from '../ui/Text.jsx';

export function OpenLibrarySearch({ onSelect, autoFocus }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const docs = await searchOpenLibrary(query, { signal: controller.signal });
        setResults(docs);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError('Search paused — try again in a moment.');
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <Stack gap="var(--space-3)">
      <Input
        label="Search Open Library"
        placeholder="Search title or author…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus={autoFocus}
      />
      {loading ? (
        <Stack align="center" style={{ padding: 'var(--space-4)' }}>
          <Spinner />
        </Stack>
      ) : null}
      {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
      {results.length > 0 ? (
        <Stack gap="var(--space-2)">
          <Text variant="label">Suggestions</Text>
          {results.map((item) => (
            <button
              key={item.openLibraryKey ?? `${item.title}-${item.author}`}
              type="button"
              onClick={() => onSelect(item)}
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'center',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-card)',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <BookCover src={item.coverUrl} alt="" width={40} />
              <Stack gap="var(--space-1)" style={{ flex: 1, minWidth: 0 }}>
                <Text variant="emphasis" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </Text>
                <Text variant="label">
                  {item.author}
                  {item.publishYear ? ` · ${item.publishYear}` : ''}
                  {item.lexile != null ? ` · ${formatLexile(item.lexile)}` : ''}
                  {item.readingLevel ? ` · ${item.readingLevel}` : ''}
                </Text>
              </Stack>
            </button>
          ))}
        </Stack>
      ) : null}
    </Stack>
  );
}
