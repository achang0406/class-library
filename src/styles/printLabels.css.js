import { AVERY_5658 } from '../constants/avery5658.js';

const {
  sheetWidth,
  sheetHeight,
  labelWidth,
  labelHeight,
  marginTop,
  marginBottom,
  marginLeft,
  marginRight,
  columnGap,
  rowGap,
  columns,
  qrSize,
} = AVERY_5658;

/** Avery 5658 — stacked QR (0.8" min) + LIB id below. Titles shown in on-screen match list only. */
export const labelPrintStyles = `
@media screen {
  .label-print-screen {
    padding: var(--space-4);
    text-align: center;
  }
  .label-print-preview-note {
    max-width: ${sheetWidth};
    margin: 0 auto var(--space-3);
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: center;
    line-height: 1.4;
  }
  .label-print-match-list {
    max-width: ${sheetWidth};
    margin: 0 auto var(--space-5);
    text-align: left;
    font-family: Arial, sans-serif;
    font-size: 12px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: var(--space-3);
    background: var(--color-card);
  }
  .label-print-match-list h3 {
    margin: 0 0 var(--space-2);
    font-size: 13px;
  }
  .label-print-match-row {
    display: flex;
    gap: var(--space-3);
    padding: var(--space-1) 0;
    border-bottom: 1px solid var(--color-border);
  }
  .label-print-match-row:last-child {
    border-bottom: none;
  }
  .label-print-match-row code {
    font-family: monospace;
    min-width: 6.5em;
  }
  .label-print-pages {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
  }
  .label-print-page {
    width: ${sheetWidth};
    height: ${sheetHeight};
    background: white;
    box-shadow: 0 4px 24px rgba(27, 67, 50, 0.12);
    box-sizing: border-box;
  }
  .label-print-area {
    outline: 1px dashed var(--color-border);
  }
  .label-sticker {
    outline: 1px dashed #ccc;
  }
}

@media print {
  @page {
    size: letter;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
  }
  body * {
    visibility: hidden;
  }
  .label-print-pages,
  .label-print-pages * {
    visibility: visible;
  }
  .label-print-pages {
    position: absolute;
    left: 0;
    top: 0;
  }
  .label-print-page {
    width: ${sheetWidth};
    height: ${sheetHeight};
    box-sizing: border-box;
    page-break-after: always;
    break-after: page;
  }
  .label-print-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .label-print-area,
  .label-sticker {
    outline: none;
  }
  .no-print {
    display: none !important;
  }
}

.label-print-area {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft};
  display: grid;
  grid-template-columns: repeat(${columns}, ${labelWidth});
  column-gap: ${columnGap};
  grid-auto-rows: ${labelHeight};
  row-gap: ${rowGap};
}

.label-sticker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 1px;
  overflow: hidden;
  box-sizing: border-box;
  width: ${labelWidth};
  height: ${labelHeight};
}

.label-qr {
  width: ${qrSize};
  height: ${qrSize};
  min-width: ${qrSize};
  min-height: ${qrSize};
  flex-shrink: 0;
  display: block;
}

.label-barcode {
  font-size: 6px;
  font-family: monospace;
  font-weight: 600;
  line-height: 1;
  margin-top: 0;
  text-align: center;
  letter-spacing: -0.02em;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
}
`;
