import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { markLabelsPrinted } from '../../lib/books.js';
import { labelPrintStyles } from '../../styles/printLabels.css.js';

export function LabelPrintSheet({ books, onPrinted }) {
  const [qrMap, setQrMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    async function generate() {
      const entries = await Promise.all(
        books.map(async (book) => {
          const dataUrl = await QRCode.toDataURL(book.barcode, { margin: 0, width: 96 });
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
    if (!books.length || Object.keys(qrMap).length !== books.length) return;
    const timer = setTimeout(async () => {
      window.print();
      try {
        await markLabelsPrinted(books.map((b) => b.id));
        onPrinted?.();
      } catch {
        // still printed physically
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [books, qrMap, onPrinted]);

  return (
    <>
      <style>{labelPrintStyles}</style>
      <div className="label-print-screen no-print">
        <p>Opening print dialog…</p>
        <p className="label-print-preview-note">
          Preview below — 30 labels per letter page (3 columns × 10 rows). Each copy of the same
          title gets its own barcode.
        </p>
      </div>
      <div className="label-print-area">
        {books.map((book) => (
          <div key={book.id} className="label-sticker">
            <img src={qrMap[book.id]} alt="" className="label-qr" />
            <div className="label-text">
              <div className="label-title">{book.title}</div>
              <div className="label-author">{book.author ?? ''}</div>
              <div className="label-barcode">{book.barcode}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
