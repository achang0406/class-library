import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { OpenLibrarySearch } from '../../components/books/OpenLibrarySearch.jsx';
import { IsbnScanPanel } from '../../components/books/IsbnScanPanel.jsx';
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
import { createBookCopies, findExistingCopies } from '../../lib/books.js';
import { lookupOpenLibraryByIsbn, normalizeIsbn } from '../../lib/openLibrary.js';

const emptyForm = {
  title: '',
  author: '',
  genre: 'Fiction',
  cover_url: null,
  isbn: null,
  publish_year: null,
  open_library_key: null,
};

function buildPayload(form) {
  return {
    title: form.title.trim(),
    author: form.author?.trim() || null,
    genre: form.genre,
    cover_url: form.cover_url,
    isbn: form.isbn,
    publish_year: form.publish_year,
    open_library_key: form.open_library_key,
  };
}

export default function TeacherAddPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rapidMode = searchParams.get('mode') === 'rapid';

  const [form, setForm] = useState(emptyForm);
  const [copies, setCopies] = useState('1');
  const [sessionQueue, setSessionQueue] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicate, setDuplicate] = useState(null);
  const [savedBooks, setSavedBooks] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showQueueReview, setShowQueueReview] = useState(false);
  const [showIsbnScan, setShowIsbnScan] = useState(false);
  const [isbnLookupBusy, setIsbnLookupBusy] = useState(false);
  const [isbnLookupError, setIsbnLookupError] = useState('');

  const lastGenre = useMemo(() => form.genre, [form.genre]);
  const copyCount = Math.min(Math.max(parseInt(copies, 10) || 1, 1), 20);

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
    setDuplicate(null);
  }

  async function handleIsbnLookup(raw) {
    setIsbnLookupBusy(true);
    setIsbnLookupError('');
    setError('');
    try {
      const item = await lookupOpenLibraryByIsbn(raw);
      const isbn = normalizeIsbn(raw);
      if (!item) {
        setIsbnLookupError(
          isbn
            ? `No Open Library match for ISBN ${isbn}. Try title search below or enter manually.`
            : 'Not a valid ISBN. Scan the barcode above the ISBN on the back cover.',
        );
        return;
      }
      applySelection(item);
      setShowIsbnScan(false);
    } catch (err) {
      setIsbnLookupError(err.message ?? 'ISBN lookup failed');
    } finally {
      setIsbnLookupBusy(false);
    }
  }

  async function saveBooks({ allowDuplicate = false } = {}) {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError('');
    setDuplicate(null);

    try {
      const existing = await findExistingCopies({
        isbn: form.isbn,
        openLibraryKey: form.open_library_key,
      });

      if (!allowDuplicate && copyCount === 1 && existing.count > 0 && existing.sample) {
        setDuplicate({ ...existing.sample, copyCount: existing.count });
        return;
      }

      const created = await createBookCopies(buildPayload(form), copyCount);

      if (rapidMode) {
        setSessionQueue((q) => [...q, ...created]);
        setForm({ ...emptyForm, genre: form.genre });
        setCopies('1');
      } else {
        setSavedBooks(created);
        setShowPrintModal(true);
      }
    } catch (err) {
      setError(err.message ?? 'Failed to save book');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(e) {
    e?.preventDefault();
    await saveBooks();
  }

  const printSession = useCallback(() => {
    if (!sessionQueue.length) return;
    const ids = sessionQueue.map((b) => b.id).join(',');
    navigate(`/teacher/labels/print?ids=${ids}`);
  }, [sessionQueue, navigate]);

  const existingCopyCount = duplicate?.copyCount ?? 0;

  return (
    <PageContainer>
      <Stack gap="var(--space-5)">
        <SupabaseBanner />
        {rapidMode ? (
          <Stack gap="var(--space-2)">
            <Text variant="label">Rapid Add — {sessionQueue.length} in session queue</Text>
            {sessionQueue.length > 0 ? (
              <Button variant="accent" fullWidth onClick={() => setShowQueueReview(true)}>
                Review & print {sessionQueue.length} labels
              </Button>
            ) : null}
          </Stack>
        ) : null}

        {showIsbnScan ? (
          <IsbnScanPanel
            onLookup={handleIsbnLookup}
            onCancel={() => {
              setShowIsbnScan(false);
              setIsbnLookupError('');
            }}
            busy={isbnLookupBusy}
            error={isbnLookupError}
          />
        ) : (
          <Button variant="secondary" fullWidth onClick={() => setShowIsbnScan(true)}>
            Scan ISBN on back cover
          </Button>
        )}

        <OpenLibrarySearch onSelect={applySelection} autoFocus={!showIsbnScan} />

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
            <Input
              label="Copies"
              type="number"
              min={1}
              max={20}
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
            />
            <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
              Each copy gets its own barcode sticker — use for multiple physical books with the
              same title.
            </Text>
            {copyCount > 1 ? (
              <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                Adding {copyCount} copies — each will get a unique LIB- barcode for checkout.
              </Text>
            ) : null}
            {duplicate ? (
              <Stack gap="var(--space-3)">
                <Text style={{ color: 'var(--color-overdue)' }}>
                  This title is already in your library
                  {existingCopyCount > 1 ? ` (${existingCopyCount} copies)` : ''}: &ldquo;
                  {duplicate.title}&rdquo;.
                </Text>
                <Stack gap="var(--space-2)" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Link to={`/books/${duplicate.id}`}>
                    <Button type="button" variant="secondary">
                      View existing
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="primary"
                    loading={saving}
                    onClick={() => saveBooks({ allowDuplicate: true })}
                  >
                    Add another copy
                  </Button>
                </Stack>
              </Stack>
            ) : null}
            {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
            {!duplicate ? (
              <Button type="submit" variant="primary" fullWidth loading={saving}>
                {rapidMode
                  ? copyCount > 1
                    ? `Save ${copyCount} copies & Next`
                    : 'Save & Next'
                  : copyCount > 1
                    ? `Save ${copyCount} copies`
                    : 'Save book'}
              </Button>
            ) : null}
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
        open={showPrintModal && savedBooks.length > 0}
        title={savedBooks.length > 1 ? `${savedBooks.length} copies saved!` : 'Book saved!'}
        onClose={() => setShowPrintModal(false)}
        footer={
          <Stack gap="var(--space-2)">
            <Button
              variant="primary"
              fullWidth
              onClick={() =>
                navigate(`/teacher/labels/print?ids=${savedBooks.map((b) => b.id).join(',')}`)
              }
            >
              Print {savedBooks.length > 1 ? 'all labels' : 'label now'}
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setShowPrintModal(false)}>
              Print later
            </Button>
          </Stack>
        }
      >
        <Stack gap="var(--space-2)">
          {savedBooks.map((book) => (
            <Text key={book.id}>
              <strong>{book.title}</strong> — {book.barcode}
            </Text>
          ))}
        </Stack>
      </Modal>

      <Modal
        open={showQueueReview && sessionQueue.length > 0}
        title={`Review queue (${sessionQueue.length} books)`}
        onClose={() => setShowQueueReview(false)}
        footer={
          <Stack gap="var(--space-2)">
            <Button variant="primary" fullWidth onClick={printSession}>
              Print all labels
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setShowQueueReview(false)}>
              Keep adding books
            </Button>
          </Stack>
        }
      >
        <Stack gap="var(--space-2)">
          {sessionQueue.map((book) => (
            <Stack
              key={book.id}
              gap="var(--space-3)"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 'var(--space-2)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <BookCover src={book.cover_url} alt="" width={48} />
              <Stack gap="var(--space-1)" style={{ flex: 1, minWidth: 0 }}>
                <Text variant="emphasis">{book.title}</Text>
                <Text variant="label">
                  {book.author ?? 'Unknown author'} · {book.barcode}
                </Text>
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Modal>
    </PageContainer>
  );
}
