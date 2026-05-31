import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OpenLibrarySearch } from '../../components/books/OpenLibrarySearch.jsx';
import { BookCover } from '../../components/ui/BookCover.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Select } from '../../components/ui/Select.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { SupabaseBanner } from '../../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { GENRES } from '../../constants/genres.js';
import { createBook, findDuplicateBook } from '../../lib/books.js';

const emptyForm = {
  title: '',
  author: '',
  genre: 'Fiction',
  cover_url: null,
  isbn: null,
  publish_year: null,
  open_library_key: null,
};

export default function TeacherAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rapidMode = searchParams.get('mode') === 'rapid';

  const [form, setForm] = useState(emptyForm);
  const [sessionQueue, setSessionQueue] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedBook, setSavedBook] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const lastGenre = useMemo(() => form.genre, [form.genre]);

  function applySelection(item) {
    setForm({
      title: item.title,
      author: item.author ?? '',
      genre: item.genre ?? lastGenre,
      cover_url: item.coverUrl,
      isbn: item.isbn,
      publish_year: item.publishYear,
      open_library_key: item.openLibraryKey,
    });
    setError('');
  }

  async function handleSave(e) {
    e?.preventDefault();
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const dup = await findDuplicateBook({
        isbn: form.isbn,
        openLibraryKey: form.open_library_key,
      });
      if (dup) {
        setError(`This book may already be in your library: "${dup.title}".`);
        setSaving(false);
        return;
      }

      const book = await createBook({
        title: form.title.trim(),
        author: form.author?.trim() || null,
        genre: form.genre,
        cover_url: form.cover_url,
        isbn: form.isbn,
        publish_year: form.publish_year,
        open_library_key: form.open_library_key,
      });

      if (rapidMode) {
        setSessionQueue((q) => [...q, book]);
        setForm({ ...emptyForm, genre: form.genre });
        setSavedBook(null);
      } else {
        setSavedBook(book);
        setShowPrintModal(true);
      }
    } catch (err) {
      setError(err.message ?? 'Failed to save book');
    } finally {
      setSaving(false);
    }
  }

  const printSession = useCallback(() => {
    if (!sessionQueue.length) return;
    const ids = sessionQueue.map((b) => b.id).join(',');
    navigate(`/teacher/labels/print?ids=${ids}`);
  }, [sessionQueue, navigate]);

  return (
    <PageContainer>
      <Stack gap="var(--space-5)">
        <SupabaseBanner />
        {rapidMode ? (
          <Stack gap="var(--space-2)">
            <Text variant="label">Rapid Add — {sessionQueue.length} in session queue</Text>
            {sessionQueue.length > 0 ? (
              <Button variant="accent" fullWidth onClick={printSession}>
                Review & print {sessionQueue.length} labels
              </Button>
            ) : null}
          </Stack>
        ) : null}

        <OpenLibrarySearch onSelect={applySelection} autoFocus />

        <form onSubmit={handleSave}>
          <Stack gap="var(--space-4)">
            {form.title ? (
              <Stack
                gap="var(--space-3)"
                style={{ flexDirection: 'row', alignItems: 'flex-start' }}
              >
                <BookCover src={form.cover_url} alt="" width={80} />
                <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                  Selected — fields auto-filled. Edit if needed.
                </Text>
              </Stack>
            ) : null}
            <Input
              label="Title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <Input
              label="Author"
              value={form.author}
              onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            />
            <Select
              label="Genre"
              value={form.genre}
              onChange={(e) => setForm((f) => ({ ...f, genre: e.target.value }))}
            >
              {GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
            {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
            <Button type="submit" variant="primary" fullWidth loading={saving}>
              {rapidMode ? 'Save & Next' : 'Save book'}
            </Button>
          </Stack>
        </form>

        {!rapidMode ? (
          <Link to="/teacher/add?mode=rapid" style={{ textAlign: 'center' }}>
            <Text variant="emphasis" style={{ color: 'var(--color-primary)' }}>
              Switch to Rapid Add mode
            </Text>
          </Link>
        ) : (
          <Link to="/teacher/add" style={{ textAlign: 'center' }}>
            <Text variant="emphasis" style={{ color: 'var(--color-primary)' }}>
              Single book mode
            </Text>
          </Link>
        )}
      </Stack>

      <Modal
        open={showPrintModal && !!savedBook}
        title="Book saved!"
        onClose={() => setShowPrintModal(false)}
        footer={
          <Stack gap="var(--space-2)">
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate(`/teacher/labels/print?ids=${savedBook?.id}`)}
            >
              Print label now
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setShowPrintModal(false)}>
              Print later
            </Button>
          </Stack>
        }
      >
        <Text>
          <strong>{savedBook?.title}</strong> was added as {savedBook?.barcode}.
        </Text>
      </Modal>
    </PageContainer>
  );
}
