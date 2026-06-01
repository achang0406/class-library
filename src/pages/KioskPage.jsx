import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarcodeScannerPanel } from '../components/scanner/BarcodeScanner.jsx';
import { BookCover } from '../components/ui/BookCover.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Stack } from '../components/ui/Stack.jsx';
import { Text } from '../components/ui/Text.jsx';
import { SupabaseBanner } from '../components/layout/SupabaseBanner.jsx';
import { PageContainer } from '../components/layout/PageContainer.jsx';
import { useBorrowers } from '../hooks/useBorrowers.js';
import { getBookByBarcode } from '../lib/books.js';
import {
  checkoutBook,
  returnBook,
  enrichCheckout,
  getActiveCheckoutForBook,
} from '../lib/checkouts.js';

const STEPS = {
  HOME: 'home',
  SCAN_CHECKOUT: 'scan-checkout',
  SCAN_RETURN: 'scan-return',
  CONFIRM: 'confirm',
  BORROWER: 'borrower',
  DONE_CHECKOUT: 'done-checkout',
  DONE_RETURN: 'done-return',
};

export default function KioskPage() {
  const [step, setStep] = useState(STEPS.HOME);
  const [book, setBook] = useState(null);
  const [returnInfo, setReturnInfo] = useState(null);
  const [borrowerTab, setBorrowerTab] = useState('student');
  const [guestName, setGuestName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneMessage, setDoneMessage] = useState('');
  const [doneBorrowerType, setDoneBorrowerType] = useState('student');

  const { borrowers: students } = useBorrowers('student');
  const { borrowers: staff } = useBorrowers('staff');

  const reset = useCallback(() => {
    setStep(STEPS.HOME);
    setBook(null);
    setReturnInfo(null);
    setGuestName('');
    setError('');
    setDoneMessage('');
    setDoneBorrowerType('student');
  }, []);

  const handleScanCheckout = useCallback(async (barcode) => {
    setError('');
    setBusy(true);
    try {
      const b = await getBookByBarcode(barcode);
      if (!b) {
        setError('Book not found. Check the sticker.');
        return;
      }
      if (b.status === 'checked_out') {
        setError('This book is already checked out.');
        return;
      }
      setBook(b);
      setStep(STEPS.BORROWER);
    } catch (err) {
      setError(err.message ?? 'Lookup failed');
    } finally {
      setBusy(false);
    }
  }, []);

  const handleScanReturn = useCallback(async (barcode) => {
    setError('');
    setBusy(true);
    try {
      const b = await getBookByBarcode(barcode);
      if (!b) {
        setError('Book not found.');
        return;
      }
      if (b.status === 'available') {
        setError('This book is already on the shelf — thanks!');
        return;
      }
      const prior = await getActiveCheckoutForBook(b.id);
      const returned = await returnBook(b.id);
      setReturnInfo({
        book: b,
        checkout: returned ? enrichCheckout(returned) : prior ? enrichCheckout(prior) : null,
      });
      setStep(STEPS.DONE_RETURN);
    } catch (err) {
      setError(err.message ?? 'Return failed');
    } finally {
      setBusy(false);
    }
  }, []);

  async function confirmBorrower(name, type, borrowerId = null) {
    if (!book || !name.trim()) return;
    setBusy(true);
    setError('');
    try {
      await checkoutBook({
        bookId: book.id,
        borrowerId,
        borrowerName: name.trim(),
        borrowerType: type,
      });
      setDoneMessage(name.trim());
      setDoneBorrowerType(type);
      setStep(STEPS.DONE_CHECKOUT);
    } catch (err) {
      setError(err.message ?? 'Checkout failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer narrow>
      <Stack
        gap="var(--space-5)"
        style={{ paddingTop: 'var(--space-4)', paddingBottom: 'var(--space-8)' }}
      >
        <SupabaseBanner />

        {step === STEPS.HOME ? (
          <>
            <Text as="h1" variant="display" style={{ textAlign: 'center' }}>
              Library Kiosk
            </Text>
            <Button variant="kiosk" fullWidth onClick={() => setStep(STEPS.SCAN_CHECKOUT)}>
              Check Out a Book
            </Button>
            <Button variant="secondary" fullWidth onClick={() => setStep(STEPS.SCAN_RETURN)}>
              Return a Book
            </Button>
            <Link to="/" style={{ textAlign: 'center' }}>
              <Text variant="emphasis" style={{ color: 'var(--color-primary)' }}>
                Back to home
              </Text>
            </Link>
          </>
        ) : null}

        {step === STEPS.SCAN_CHECKOUT ? (
          <>
            <Text as="h2" variant="title">
              Scan your book
            </Text>
            <BarcodeScannerPanel onScan={handleScanCheckout} onCancel={reset} />
            {busy ? <Text>Looking up book…</Text> : null}
            {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
          </>
        ) : null}

        {step === STEPS.SCAN_RETURN ? (
          <>
            <Text as="h2" variant="title">
              Return a book
            </Text>
            <BarcodeScannerPanel onScan={handleScanReturn} onCancel={reset} />
            {busy ? <Text>Processing…</Text> : null}
            {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
          </>
        ) : null}

        {step === STEPS.BORROWER && book ? (
          <>
            <Stack gap="var(--space-3)" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookCover src={book.cover_url} alt="" width={72} />
              <Stack gap="var(--space-1)">
                <Text variant="title">{book.title}</Text>
                {book.author ? (
                  <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
                    {book.author}
                  </Text>
                ) : null}
              </Stack>
            </Stack>
            <Text variant="emphasis">Who is borrowing?</Text>
            <Stack gap="var(--space-2)" style={{ flexDirection: 'row' }}>
              <Button
                variant={borrowerTab === 'student' ? 'primary' : 'secondary'}
                onClick={() => setBorrowerTab('student')}
                style={{ flex: 1 }}
              >
                My Class
              </Button>
              <Button
                variant={borrowerTab === 'staff' ? 'primary' : 'secondary'}
                onClick={() => setBorrowerTab('staff')}
                style={{ flex: 1 }}
              >
                Teachers & Guests
              </Button>
            </Stack>
            {borrowerTab === 'student' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 'var(--space-2)',
                }}
              >
                {students.map((s) => (
                  <Button
                    key={s.id}
                    variant="secondary"
                    disabled={busy}
                    onClick={() => confirmBorrower(s.display_name, 'student', s.id)}
                    style={{ minHeight: 'var(--space-8)' }}
                  >
                    {s.display_name}
                  </Button>
                ))}
              </div>
            ) : (
              <Stack gap="var(--space-3)">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 'var(--space-2)',
                  }}
                >
                  {staff.map((s) => (
                    <Button
                      key={s.id}
                      variant="secondary"
                      disabled={busy}
                      onClick={() => confirmBorrower(s.display_name, 'staff', s.id)}
                    >
                      {s.display_name}
                    </Button>
                  ))}
                </div>
                <Input
                  label="Or type a guest name"
                  placeholder="Family friend name…"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                />
                <Button
                  variant="primary"
                  fullWidth
                  disabled={!guestName.trim() || busy}
                  onClick={() => confirmBorrower(guestName, 'guest')}
                >
                  Check out as guest
                </Button>
              </Stack>
            )}
            {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </>
        ) : null}

        {step === STEPS.DONE_CHECKOUT && book ? (
          <>
            <Text
              as="h2"
              variant="display"
              style={{ color: 'var(--color-primary)', textAlign: 'center' }}
            >
              {doneBorrowerType === 'student'
                ? `Enjoy your book, ${doneMessage}!`
                : doneBorrowerType === 'staff'
                  ? `Checked out to ${doneMessage} — thanks!`
                  : `Checked out to ${doneMessage} — enjoy!`}
            </Text>
            <Stack gap="var(--space-3)" style={{ flexDirection: 'row', alignItems: 'center' }}>
              <BookCover src={book.cover_url} alt="" width={80} />
              <Text variant="body">
                <strong>{book.title}</strong>
                <br />
                Checked out to {doneMessage}
              </Text>
            </Stack>
            <Button variant="kiosk" fullWidth onClick={reset}>
              Done
            </Button>
          </>
        ) : null}

        {step === STEPS.DONE_RETURN && returnInfo ? (
          <>
            <Text as="h2" variant="title" style={{ color: 'var(--color-primary)' }}>
              Thanks for returning!
            </Text>
            <Text variant="body">
              <strong>{returnInfo.book.title}</strong>
              {returnInfo.checkout ? (
                <>
                  <br />
                  Was checked out to {returnInfo.checkout.borrower_name} for{' '}
                  {returnInfo.checkout.daysOut} day{returnInfo.checkout.daysOut === 1 ? '' : 's'}
                </>
              ) : null}
            </Text>
            <Button variant="kiosk" fullWidth onClick={reset}>
              Scan another book
            </Button>
          </>
        ) : null}
      </Stack>
    </PageContainer>
  );
}
