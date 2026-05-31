import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { bulkCreateBooks } from '../../lib/books.js';

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const titleIdx = header.findIndex((h) => h.includes('title'));
  const authorIdx = header.findIndex((h) => h.includes('author'));
  const genreIdx = header.findIndex((h) => h.includes('genre'));

  return lines
    .slice(1)
    .map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      return {
        title: cols[titleIdx >= 0 ? titleIdx : 0] ?? '',
        author: authorIdx >= 0 ? cols[authorIdx] : null,
        genre: genreIdx >= 0 ? cols[genreIdx] : 'Other',
      };
    })
    .filter((r) => r.title);
}

export default function TeacherImportPage() {
  const navigate = useNavigate();
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsv(String(reader.result));
        setPreview(rows);
        setError('');
      } catch {
        setError('Could not parse CSV.');
        setPreview([]);
      }
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!preview.length) return;
    setBusy(true);
    setError('');
    try {
      const created = await bulkCreateBooks(
        preview.map((r) => ({
          title: r.title,
          author: r.author,
          genre: r.genre || 'Other',
          status: 'available',
        })),
      );
      const ids = created.map((b) => b.id).join(',');
      navigate(`/teacher/labels/print?ids=${ids}`);
    } catch (err) {
      setError(err.message ?? 'Import failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <Stack gap="var(--space-4)">
        <SupabaseBanner />
        <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
          Upload a CSV with columns: title, author, genre (optional).
        </Text>
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            padding: 'var(--space-6)',
            border: '2px dashed var(--color-border)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-card)',
            cursor: 'pointer',
          }}
        >
          <Text variant="emphasis">Drop CSV file here or click to browse</Text>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            style={{ display: 'none' }}
          />
        </label>
        {preview.length > 0 ? (
          <>
            <Text variant="label">Preview ({preview.length} rows)</Text>
            <Stack gap="var(--space-1)">
              {preview.slice(0, 5).map((row, i) => (
                <Text key={i} variant="body">
                  {row.title} — {row.author ?? 'Unknown'} ({row.genre})
                </Text>
              ))}
              {preview.length > 5 ? (
                <Text variant="label">…and {preview.length - 5} more</Text>
              ) : null}
            </Stack>
            <Button variant="primary" fullWidth loading={busy} onClick={handleImport}>
              Import {preview.length} books & print labels
            </Button>
          </>
        ) : null}
        {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
      </Stack>
    </PageContainer>
  );
}
