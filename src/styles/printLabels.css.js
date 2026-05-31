export const labelPrintStyles = `
@media screen {
  .label-print-screen {
    padding: var(--space-4);
    text-align: center;
  }
  .label-print-preview-note {
    max-width: 8.5in;
    margin: 0 auto var(--space-3);
    font-family: Arial, sans-serif;
    font-size: 12px;
    color: var(--color-text-muted);
    text-align: center;
  }
  .label-print-area {
    display: grid;
    grid-template-columns: repeat(3, 2.625in);
    grid-auto-rows: 1in;
    gap: 0;
    width: 8.5in;
    margin: 0 auto;
    padding: 0.15in;
    background: white;
    box-shadow: 0 4px 24px rgba(27, 67, 50, 0.12);
  }
  .label-sticker {
    outline: 1px dashed var(--color-border);
  }
}

@media print {
  @page { margin: 0.15in; size: letter; }
  body * { visibility: hidden; }
  .label-print-area, .label-print-area * { visibility: visible; }
  .label-print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    display: grid;
    grid-template-columns: repeat(3, 2.625in);
    grid-auto-rows: 1in;
    gap: 0;
    padding: 0;
    box-shadow: none;
    background: white;
  }
  .label-sticker { outline: none; }
  .no-print { display: none !important; }
}

.label-sticker {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 5px;
  overflow: hidden;
  box-sizing: border-box;
  height: 1in;
  width: 2.625in;
}

.label-qr {
  width: 0.72in;
  height: 0.72in;
  flex-shrink: 0;
}

.label-text {
  flex: 1;
  min-width: 0;
  font-family: Arial, sans-serif;
  line-height: 1.12;
}

.label-title {
  font-size: 8px;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.label-author {
  font-size: 7px;
  color: #52796F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label-barcode {
  font-size: 6px;
  font-family: monospace;
  margin-top: 1px;
}
`;
