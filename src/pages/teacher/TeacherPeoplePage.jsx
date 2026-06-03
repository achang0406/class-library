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
import { bulkCreateBorrowers, createBorrower, deactivateBorrower } from '../../lib/borrowers.js';

function parseStudentCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nameIdx = header.findIndex((h) => h === 'name' || h.includes('student') || h.includes('display'));
  const hasHeader = nameIdx >= 0;
  const start = hasHeader ? 1 : 0;
  const column = hasHeader ? nameIdx : 0;

  return lines
    .slice(start)
    .map((line) => line.split(',')[column]?.trim())
    .filter(Boolean);
}

export default function TeacherPeoplePage() {
  const [tab, setTab] = useState('student');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importBusy, setImportBusy] = useState(false);

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

  function handleStudentCsvFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const names = parseStudentCsv(String(reader.result));
        setImportPreview(names);
        setError('');
      } catch {
        setError('Could not parse student CSV.');
        setImportPreview([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleImportStudents() {
    if (!importPreview.length) return;
    setImportBusy(true);
    setError('');
    try {
      await bulkCreateBorrowers(
        importPreview.map((displayName) => ({
          displayName,
          borrowerType: 'student',
        })),
      );
      setImportPreview([]);
      reload();
    } catch (err) {
      setError(err.message ?? 'Failed to import students');
    } finally {
      setImportBusy(false);
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

        {tab === 'student' ? (
          <Stack gap="var(--space-3)">
            <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
              Import a CSV with one student name per row. A header column named{' '}
              <strong>name</strong> is optional.
            </Text>
            <label
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-4)',
                border: '2px dashed var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-card)',
                cursor: 'pointer',
              }}
            >
              <Text variant="emphasis">Import students from CSV</Text>
              <input type="file" accept=".csv,text/csv" onChange={handleStudentCsvFile} style={{ display: 'none' }} />
            </label>
            {importPreview.length > 0 ? (
              <Stack gap="var(--space-2)">
                <Text variant="label">Preview ({importPreview.length} students)</Text>
                <Stack gap="var(--space-1)">
                  {importPreview.slice(0, 8).map((studentName) => (
                    <Text key={studentName} variant="body">
                      {studentName}
                    </Text>
                  ))}
                  {importPreview.length > 8 ? (
                    <Text variant="label">…and {importPreview.length - 8} more</Text>
                  ) : null}
                </Stack>
                <Button variant="accent" loading={importBusy} onClick={handleImportStudents}>
                  Import {importPreview.length} students
                </Button>
              </Stack>
            ) : null}
          </Stack>
        ) : null}

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
