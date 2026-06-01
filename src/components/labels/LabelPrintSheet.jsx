import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { AVERY_5658, chunkForLabelSheets } from '../../constants/avery5658.js';
import { labelPrintStyles } from '../../styles/printLabels.css.js';

/** ~240px renders sharply at 0.8in on typical laser/inkjet printers. */
const QR_RENDER_PX = 240;

function LabelCell({ book, qrSrc }) {
  return (
    <div className="label-cell">
      <div className="label-sticker">
        <img src={qrSrc} alt="" className="label-qr" />
        <div className="label-barcode">{book.barcode}</div>
      </div>
      <div className="label-title">{book.title}</div>
    </div>
  );
}

export function LabelPrintSheet({ books, onPrintComplete }) {
  const [qrMap, setQrMap] = useState({});
  const [printFinished, setPrintFinished] = useState(false);
  const autoPrintStarted = useRef(false);
  const pages = useMemo(() => chunkForLabelSheets(books), [books]);

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const entries = await Promise.all(
        books.map(async (book) => {
          const dataUrl = await QRCode.toDataURL(book.barcode, {
            margin: 1,
            width: QR_RENDER_PX,
          });
          return [book.id, dataUrl];
        }),
      );
      if (!cancelled) setQrMap(Object.fromEntries(entries));
    }
    generate();
    return () => {
      cancelled = true;
    };
  }, [books]);

  useEffect(() => {
    if (!books.length || Object.keys(qrMap).length !== books.length) return undefined;
    if (autoPrintStarted.current) return undefined;

    autoPrintStarted.current = true;
    const timer = setTimeout(() => {
      window.print();
    }, 400);
    return () => clearTimeout(timer);
  }, [books, qrMap]);

  useEffect(() => {
    function handleAfterPrint() {
      setPrintFinished(true);
      onPrintComplete?.();
    }
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, [onPrintComplete]);

  return (
    <>
      <style>{labelPrintStyles}</style>
      {!printFinished ? (
        <div className="label-print-screen no-print">
          <p>Opening print dialog…</p>
          <p className="label-print-preview-note">
            <a href={AVERY_5658.productUrl} target="_blank" rel="noopener noreferrer">
              Avery 5658
            </a>{' '}
            — {pages.length} sheet{pages.length === 1 ? '' : 's'} of stickers ({AVERY_5658.qrSize} QR
            + id below). Book titles print in the gap below each sticker (not on the label). Print at{' '}
            <strong>100% scale</strong>, margins none. The match list below does not print.
          </p>
          <div className="label-print-match-list">
            <h3>Match stickers to books ({books.length})</h3>
            {books.map((book) => (
              <div key={book.id} className="label-print-match-row">
                <code>{book.barcode}</code>
                <span>
                  {book.title}
                  {book.author ? ` — ${book.author}` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className={`label-print-pages${printFinished ? ' label-print-pages-offscreen' : ''}`}>
        {pages.map((pageBooks, pageIndex) => (
          <div key={pageIndex} className="label-print-page">
            <div className="label-print-area">
              {pageBooks.map((book) => (
                <LabelCell key={book.id} book={book} qrSrc={qrMap[book.id]} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
