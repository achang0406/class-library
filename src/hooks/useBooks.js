import { useCallback, useEffect, useState } from 'react';
import { listBooks } from '../lib/books.js';
import { isSupabaseConfigured } from '../lib/supabase.js';

export function useBooks(filters = {}) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const search = filters.search;
  const genre = filters.genre;
  const status = filters.status;
  const needsLabel = filters.needsLabel;

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setBooks([]);
      setLoading(false);
      setError('Supabase is not configured.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await listBooks({ search, genre, status, needsLabel });
      setBooks(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load books');
    } finally {
      setLoading(false);
    }
  }, [search, genre, status, needsLabel]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { books, loading, error, reload };
}
