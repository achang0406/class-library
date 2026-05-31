/** Avery 5160 / compatible address labels (30 per US Letter sheet). */
export const AVERY_5160 = {
  labelsPerSheet: 30,
  columns: 3,
  rows: 10,
  sheetWidth: '8.5in',
  sheetHeight: '11in',
  labelWidth: '2.625in',
  labelHeight: '1in',
  marginTop: '0.5in',
  marginLeft: '0.15625in',
  marginRight: '0.21875in',
  columnGap: '0.125in',
  /** Minimum QR size for reliable iPad/phone scanning at kiosk distance. */
  qrSize: '0.8in',
};

export function chunkForLabelSheets(books) {
  const pages = [];
  for (let i = 0; i < books.length; i += AVERY_5160.labelsPerSheet) {
    pages.push(books.slice(i, i + AVERY_5160.labelsPerSheet));
  }
  return pages;
}
