import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { useBorrowers } from '../../hooks/useBorrowers.js';
import { createBorrower, deactivateBorrower } from '../../lib/borrowers.js';

export default function TeacherPeoplePage() {
  const [tab, setTab] = useState('student');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const { borrowers, reload } = useBorrowers(tab);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await createBorrower({
        displayName: name.trim(),
        borrowerType: tab,
      });
      setName('');
      reload();
    } catch (err) {
      setError(err.message ?? 'Failed to add person');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id) {
    if (!confirm('Remove this person from the list?')) return;
    try {
      await deactivateBorrower(id);
      reload();
    } catch (err) {
      setError(err.message ?? 'Failed to remove');
    }
  }

  return (
    <PageContainer>
      <Stack gap="var(--space-4)">
        <SupabaseBanner />
        <Stack gap="var(--space-2)" style={{ flexDirection: 'row' }}>
          <Button
            variant={tab === 'student' ? 'primary' : 'secondary'}
            onClick={() => setTab('student')}
          >
            Class Roster
          </Button>
          <Button
            variant={tab === 'staff' ? 'primary' : 'secondary'}
            onClick={() => setTab('staff')}
          >
            Staff & Friends
          </Button>
        </Stack>
        <form onSubmit={handleAdd}>
          <Stack gap="var(--space-3)">
            <Input
              label={tab === 'student' ? 'Add student' : 'Add staff or friend'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
            />
            <Button type="submit" variant="accent" loading={busy}>
              Add
            </Button>
          </Stack>
        </form>
        {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
        <Stack gap="var(--space-2)">
          {borrowers.map((b) => (
            <Stack
              key={b.id}
              gap="var(--space-2)"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-3)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-card)',
              }}
            >
              <Text variant="emphasis">
                {tab === 'student' ? (
                  <Link to={`/teacher/students/${b.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                    {b.display_name}
                  </Link>
                ) : (
                  b.display_name
                )}
              </Text>
              <Stack gap="var(--space-2)" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Badge variant="neutral">Active</Badge>
                <Button variant="ghost" onClick={() => handleRemove(b.id)}>
                  Remove
                </Button>
              </Stack>
            </Stack>
          ))}
        </Stack>
        {borrowers.length === 0 ? (
          <Text style={{ color: 'var(--color-text-muted)' }}>
            No names yet — add students or staff above.
          </Text>
        ) : null}
      </Stack>
    </PageContainer>
  );
}
