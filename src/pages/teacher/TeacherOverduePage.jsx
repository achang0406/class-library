import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { BookCover } from '../../components/ui/BookCover.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { enrichCheckout, listOverdueCheckouts } from '../../lib/checkouts.js';
import { getOverdueDays, setOverdueDays } from '../../lib/settings.js';
import { DEFAULT_OVERDUE_DAYS } from '../../constants/genres.js';

export default function TeacherOverduePage() {
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState(String(getOverdueDays()));

  useEffect(() => {
    setLoading(true);
    listOverdueCheckouts({ borrowerType: filter })
      .then((rows) => setItems(rows.map(enrichCheckout)))
      .finally(() => setLoading(false));
  }, [filter, threshold]);

  function saveThreshold() {
    const n = parseInt(threshold, 10);
    if (n > 0) setOverdueDays(n);
  }

  return (
    <PageContainer>
      <Stack gap="var(--space-4)">
        <SupabaseBanner />
        <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
          Books checked out longer than the threshold below.
        </Text>
        <Stack gap="var(--space-2)" style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Input
            label={`Overdue after (days, default ${DEFAULT_OVERDUE_DAYS})`}
            type="number"
            min={1}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <Button variant="secondary" onClick={saveThreshold}>
            Apply
          </Button>
        </Stack>
        <Select label="Borrower type" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="student">Students only</option>
          <option value="staff">Staff & guests</option>
        </Select>
        {loading ? <Text>Loading…</Text> : null}
        {!loading && items.length === 0 ? (
          <Text style={{ color: 'var(--color-text-muted)' }}>No overdue books. Great job!</Text>
        ) : null}
        <Stack gap="var(--space-3)">
          {items.map((c) => (
            <Stack
              key={c.id}
              gap="var(--space-3)"
              style={{
                flexDirection: 'row',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-overdue)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-card)',
              }}
            >
              <BookCover src={c.books?.cover_url} alt="" width={56} />
              <Stack gap="var(--space-1)" style={{ flex: 1 }}>
                <Link to={`/books/${c.books?.id}`}>
                  <Text variant="emphasis" style={{ color: 'var(--color-text)' }}>
                    {c.books?.title}
                  </Text>
                </Link>
                <Text variant="body" style={{ color: 'var(--color-overdue)' }}>
                  {c.borrower_name} ({c.borrower_type}) — {c.daysOut} days out
                </Text>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </PageContainer>
  );
}
