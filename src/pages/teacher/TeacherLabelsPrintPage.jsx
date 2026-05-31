import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LabelPrintSheet } from '../../components/labels/LabelPrintSheet.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Spinner } from '../../components/ui/Spinner.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { getBooksByIds } from '../../lib/books.js';

export default function TeacherLabelsPrintPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const ids = useMemo(
    () =>
      searchParams
        .get('ids')
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
    [searchParams],
  );

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ids.length) {
      setLoading(false);
      setError('No books selected for printing.');
      return undefined;
    }

    let cancelled = false;
    getBooksByIds(ids)
      .then((rows) => {
        if (!cancelled) {
          if (!rows.length) setError('Could not find those books.');
          else setBooks(rows);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? 'Failed to load books');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (loading) {
    return (
      <Stack align="center" style={{ padding: 'var(--space-8)' }}>
        <Spinner />
        <Text variant="label">Loading labels…</Text>
      </Stack>
    );
  }

  if (error || !books.length) {
    return (
      <Stack gap="var(--space-4)" style={{ padding: 'var(--space-6)' }}>
        <Text style={{ color: 'var(--color-overdue)' }}>{error || 'No books to print.'}</Text>
        <Link to="/teacher/labels">
          <Button variant="secondary">Back to label selection</Button>
        </Link>
      </Stack>
    );
  }

  return (
    <>
      <div className="no-print" style={{ padding: 'var(--space-4)' }}>
        <Stack gap="var(--space-3)">
          <Text variant="title">
            Print {books.length} label{books.length === 1 ? '' : 's'}
          </Text>
          <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
            Your browser print dialog will open automatically. Match stickers to books by title on
            each label.
          </Text>
          <Button variant="secondary" onClick={() => navigate('/teacher/labels')}>
            Cancel
          </Button>
        </Stack>
      </div>
      <LabelPrintSheet books={books} onPrinted={() => navigate('/teacher/labels')} />
    </>
  );
}
