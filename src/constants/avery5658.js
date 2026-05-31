/** Avery 5658 / Presta 94103 — 1" square labels (48 per US Letter sheet). */
export const AVERY_5658 = {
  labelsPerSheet: 48,
  columns: 6,
  rows: 8,
  sheetWidth: '8.5in',
  sheetHeight: '11in',
  labelWidth: '1in',
  labelHeight: '1in',
  marginTop: '0.625in',
  marginBottom: '0.625in',
  marginLeft: '0.625in',
  marginRight: '0.625in',
  columnGap: '0.25in',
  rowGap: '0.25in',
  /** Minimum QR size for reliable iPad/phone scanning at kiosk distance. */
  qrSize: '0.8in',
  productUrl: 'https://www.avery.com/products/labels/5658',
};

export function chunkForLabelSheets(books) {
  const pages = [];
  for (let i = 0; i < books.length; i += AVERY_5658.labelsPerSheet) {
    pages.push(books.slice(i, i + AVERY_5658.labelsPerSheet));
  }
  return pages;
}
