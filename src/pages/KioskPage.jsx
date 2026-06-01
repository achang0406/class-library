import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarcodeScannerPanel } from '../components/scanner/BarcodeScanner.jsx';
import { BookCover } from '../components/ui/BookCover.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Stack } from '../components/ui/Stack.jsx';
import { StatusBanner } from '../components/ui/StatusBanner.jsx';
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
  BORROWER: 'borrower',
  DONE_CHECKOUT: 'done-checkout',
  DONE_RETURN: 'done-return',
};

function borrowerLabel(borrower) {
  if (!borrower) return '';
  return borrower.type === 'student' ? borrower.name : `${borrower.name} (${borrower.type})`;
}

export default function KioskPage() {
  const [step, setStep] = useState(STEPS.HOME);
  const [book, setBook] = useState(null);
  const [returnInfo, setReturnInfo] = useState(null);
  const [borrowerTab, setBorrowerTab] = useState('student');
  const [guestName, setGuestName] = useState('');
  const [sessionBorrower, setSessionBorrower] = useState(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [busy, setBusy] = useState(false);

  const { borrowers: students } = useBorrowers('student');
  const { borrowers: staff } = useBorrowers('staff');

  const reset = useCallback(() => {
    setStep(STEPS.HOME);
    setBook(null);
    setReturnInfo(null);
    setGuestName('');
    setSessionBorrower(null);
    setSessionCount(0);
    setFeedback(null);
  }, []);

  const clearSessionBorrower = useCallback(() => {
    setSessionBorrower(null);
    setSessionCount(0);
  }, []);

  const performCheckout = useCallback(async (targetBook, borrower) => {
    await checkoutBook({
      bookId: targetBook.id,
      borrowerId: borrower.id,
      borrowerName: borrower.name,
      borrowerType: borrower.type,
    });
    setSessionBorrower(borrower);
    setSessionCount((count) => count + 1);
    setBook(targetBook);
    setStep(STEPS.DONE_CHECKOUT);
  }, []);

  const handleScanCheckout = useCallback(
    async (barcode) => {
      setFeedback(null);
      setBusy(true);
      try {
        const b = await getBookByBarcode(barcode);
        if (!b) {
          setFeedback({
            variant: 'error',
            title: 'Book not found',
            body: 'Check the sticker and try again.',
          });
          return;
        }
        if (b.status === 'checked_out') {
          const active = await getActiveCheckoutForBook(b.id);
          setFeedback({
            variant: 'notice',
            title: 'Already checked out',
            body: b.title,
            author: b.author,
            detail: active
              ? `Out to ${active.borrower_name}${active.borrower_type !== 'student' ? ` (${active.borrower_type})` : ''}.`
              : 'This book is not available right now.',
          });
          return;
        }

        if (sessionBorrower) {
          await performCheckout(b, sessionBorrower);
          return;
        }

        setBook(b);
        setStep(STEPS.BORROWER);
      } catch (err) {
        setFeedback({
          variant: 'error',
          title: 'Checkout failed',
          body: err.message ?? 'Lookup failed',
        });
      } finally {
        setBusy(false);
      }
    },
    [sessionBorrower, performCheckout],
  );

  const handleScanReturn = useCallback(async (barcode) => {
    setFeedback(null);
    setBusy(true);
    try {
      const b = await getBookByBarcode(barcode);
      if (!b) {
        setFeedback({
          variant: 'error',
          title: 'Book not found',
          body: 'Check the sticker and try again.',
        });
        return;
      }
      if (b.status === 'available') {
        setFeedback({
          variant: 'notice',
          title: 'Already on the shelf',
          body: b.title,
          author: b.author,
          detail: 'Thanks — this book is already available.',
        });
        return;
      }
      const prior = await getActiveCheckoutForBook(b.id);
      const returned = await returnBook(b.id);
      const checkout = returned ? enrichCheckout(returned) : prior ? enrichCheckout(prior) : null;
      setReturnInfo({ book: b, checkout });
      setStep(STEPS.DONE_RETURN);
    } catch (err) {
      setFeedback({
        variant: 'error',
        title: 'Return failed',
        body: err.message ?? 'Return failed',
      });
    } finally {
      setBusy(false);
    }
  }, []);

  async function confirmBorrower(name, type, borrowerId = null) {
    if (!book || !name.trim()) return;
    setBusy(true);
    setFeedback(null);
    try {
      const borrower = { name: name.trim(), type, id: borrowerId };
      await performCheckout(book, borrower);
    } catch (err) {
      setFeedback({
        variant: 'error',
        title: 'Checkout failed',
        body: err.message ?? 'Checkout failed',
      });
    } finally {
      setBusy(false);
    }
  }

  function scanAnotherForSameBorrower() {
    setBook(null);
    setFeedback(null);
    setStep(STEPS.SCAN_CHECKOUT);
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
            <Button
              variant="kiosk"
              fullWidth
              onClick={() => {
                setFeedback(null);
                setStep(STEPS.SCAN_CHECKOUT);
              }}
            >
              Check Out a Book
            </Button>
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setFeedback(null);
                setStep(STEPS.SCAN_RETURN);
              }}
            >
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
            {sessionBorrower ? (
              <StatusBanner variant="success" title={`Checking out for ${borrowerLabel(sessionBorrower)}`}>
                <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                  {sessionCount > 0
                    ? `${sessionCount} book${sessionCount === 1 ? '' : 's'} already checked out this visit. Scan the next book.`
                    : 'Scan each book — no need to pick the student again.'}
                </Text>
                <Button variant="ghost" onClick={clearSessionBorrower} style={{ alignSelf: 'flex-start' }}>
                  Change student
                </Button>
              </StatusBanner>
            ) : null}
            <BarcodeScannerPanel onScan={handleScanCheckout} onCancel={reset} active={!busy} />
            {busy ? <Text>Looking up book…</Text> : null}
            {feedback ? (
              <StatusBanner variant={feedback.variant} title={feedback.title} role={feedback.variant === 'error' ? 'alert' : 'status'}>
                <Text variant="body">
                  <strong>{feedback.body}</strong>
                  {feedback.author ? (
                    <>
                      <br />
                      {feedback.author}
                    </>
                  ) : null}
                </Text>
                {feedback.detail ? (
                  <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                    {feedback.detail}
                  </Text>
                ) : null}
              </StatusBanner>
            ) : null}
          </>
        ) : null}

        {step === STEPS.SCAN_RETURN ? (
          <>
            <Text as="h2" variant="title">
              Return a book
            </Text>
            <BarcodeScannerPanel onScan={handleScanReturn} onCancel={reset} active={!busy} />
            {busy ? <Text>Processing…</Text> : null}
            {feedback ? (
              <StatusBanner variant={feedback.variant} title={feedback.title} role={feedback.variant === 'error' ? 'alert' : 'status'}>
                <Text variant="body">
                  <strong>{feedback.body}</strong>
                  {feedback.author ? (
                    <>
                      <br />
                      {feedback.author}
                    </>
                  ) : null}
                </Text>
                {feedback.detail ? (
                  <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                    {feedback.detail}
                  </Text>
                ) : null}
              </StatusBanner>
            ) : null}
          </>
        ) : null}

        {step === STEPS.BORROWER && book ? (
          <>
            <StatusBanner variant="success" title="Ready to check out">
              <Stack gap="var(--space-2)" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BookCover src={book.cover_url} alt="" width={56} />
                <Stack gap="var(--space-1)">
                  <Text variant="body">
                    <strong>{book.title}</strong>
                  </Text>
                  {book.author ? (
                    <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                      {book.author}
                    </Text>
                  ) : null}
                </Stack>
              </Stack>
            </StatusBanner>
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
            {feedback ? (
              <StatusBanner variant={feedback.variant} title={feedback.title} role="alert">
                <Text variant="body">{feedback.body}</Text>
              </StatusBanner>
            ) : null}
            <Button variant="ghost" onClick={reset}>
              Cancel
            </Button>
          </>
        ) : null}

        {step === STEPS.DONE_CHECKOUT && book ? (
          <>
            <StatusBanner
              variant="success"
              title={
                sessionBorrower?.type === 'student'
                  ? `Enjoy your book, ${sessionBorrower.name}!`
                  : sessionBorrower?.type === 'staff'
                    ? `Checked out to ${sessionBorrower.name} — thanks!`
                    : `Checked out to ${sessionBorrower?.name ?? 'guest'} — enjoy!`
              }
            >
              <Stack gap="var(--space-2)" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BookCover src={book.cover_url} alt="" width={56} />
                <Stack gap="var(--space-1)">
                  <Text variant="body">
                    <strong>{book.title}</strong>
                  </Text>
                  {book.author ? (
                    <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                      {book.author}
                    </Text>
                  ) : null}
                </Stack>
              </Stack>
              {sessionCount > 1 ? (
                <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
                  {sessionCount} books checked out for {sessionBorrower?.name} this visit.
                </Text>
              ) : null}
            </StatusBanner>
            <Button variant="kiosk" fullWidth onClick={scanAnotherForSameBorrower}>
              Scan another book
            </Button>
            <Button variant="secondary" fullWidth onClick={reset}>
              Done
            </Button>
          </>
        ) : null}

        {step === STEPS.DONE_RETURN && returnInfo ? (
          <>
            <StatusBanner variant="success" title="Thanks for returning!">
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
            </StatusBanner>
            <Button variant="kiosk" fullWidth onClick={() => setStep(STEPS.SCAN_RETURN)}>
              Scan another book
            </Button>
            <Button variant="secondary" fullWidth onClick={reset}>
              Done
            </Button>
          </>
        ) : null}
      </Stack>
    </PageContainer>
  );
}
