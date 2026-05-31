export const labelPrintStyles = `
@media screen {
  .label-print-area { display: none; }
  .label-print-screen { padding: 2rem; text-align: center; }
}

@media print {
  @page { margin: 0.25in; size: letter; }
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
  }
  .no-print { display: none !important; }
}

.label-sticker {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  overflow: hidden;
  box-sizing: border-box;
  height: 1in;
  width: 2.625in;
}

.label-qr {
  width: 0.85in;
  height: 0.85in;
  flex-shrink: 0;
}

.label-text {
  flex: 1;
  min-width: 0;
  font-family: Arial, sans-serif;
  line-height: 1.15;
}

.label-title {
  font-size: 9px;
  font-weight: 700;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.label-author {
  font-size: 8px;
  color: #52796F;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label-barcode {
  font-size: 7px;
  font-family: monospace;
  margin-top: 2px;
}
`;
