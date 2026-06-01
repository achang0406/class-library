import { createWorker } from 'tesseract.js';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { extractIsbnFromText, normalizeIsbn } from './isbn.js';

const ISBN_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
];

const TEMP_SCANNER_ID = 'cl-isbn-still-capture';

/** Self-hosted so PWA / Vercel rewrites never return HTML for worker scripts. */
const TESSERACT_OPTIONS = {
  workerPath: '/tesseract/worker.min.js',
  corePath: '/tesseract/',
  langPath: '/tesseract/tessdata',
  workerBlobURL: false,
  gzip: true,
};

let ocrWorkerPromise = null;

function ensureTempScannerElement() {
  let el = document.getElementById(TEMP_SCANNER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = TEMP_SCANNER_ID;
    el.style.display = 'none';
    document.body.appendChild(el);
  }
  return el;
}

export function getScannerVideoElement(scannerId) {
  return document.querySelector(`#${scannerId} video`);
}

async function canvasToJpegFile(canvas) {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error('Could not capture camera frame.'));
    }, 'image/jpeg', 0.92);
  });
  return new File([blob], 'isbn-capture.jpg', { type: 'image/jpeg' });
}

export function captureVideoFrame(video) {
  if (!video?.videoWidth) {
    throw new Error('Camera not ready. Wait for the preview to appear.');
  }
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  return canvas;
}

async function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = (async () => {
      const worker = await createWorker('eng', 1, TESSERACT_OPTIONS);
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
        tessedit_char_whitelist: '0123456789XxISBN-: ',
      });
      return worker;
    })();
  }
  return ocrWorkerPromise;
}

async function readIsbnFromStillImage(file) {
  ensureTempScannerElement();
  const scanner = new Html5Qrcode(TEMP_SCANNER_ID, {
    verbose: false,
    formatsToSupport: ISBN_BARCODE_FORMATS,
    useBarCodeDetectorIfSupported: true,
  });

  try {
    try {
      const decoded = await scanner.scanFile(file, false);
      const fromBarcode = normalizeIsbn(decoded);
      if (fromBarcode) return fromBarcode;
    } catch {
      // Fall through to OCR.
    }

    const worker = await getOcrWorker();
    const {
      data: { text },
    } = await worker.recognize(file);
    const fromText = extractIsbnFromText(text);
    if (fromText) return fromText;

    throw new Error(
      'No ISBN found. Center the barcode or printed ISBN number, hold steady, and try again.',
    );
  } finally {
    try {
      scanner.clear();
    } catch {
      // scanFile may already clear the temp element.
    }
  }
}

/** Grab a still JPEG from the live scanner without stopping the camera. */
export async function captureIsbnFrame(scannerId) {
  const video = getScannerVideoElement(scannerId);
  const canvas = captureVideoFrame(video);
  return canvasToJpegFile(canvas);
}

/** Capture the live camera frame and read ISBN from barcode or printed text. */
export async function captureIsbnFromScanner(scannerId) {
  const file = await captureIsbnFrame(scannerId);
  return readIsbnFromStillImage(file);
}

/** Read ISBN from an uploaded photo. */
export async function readIsbnFromPhotoFile(file) {
  return readIsbnFromStillImage(file);
}
