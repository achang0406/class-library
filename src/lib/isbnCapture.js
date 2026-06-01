import { createWorker } from 'tesseract.js';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { extractIsbnFromText, isValidIsbn, normalizeIsbn } from './isbn.js';

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

const OCR_MODES = ['7', '6', '11'];

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

function cropCanvas(source, { x, y, width, height }) {
  const sx = Math.max(0, Math.floor(x));
  const sy = Math.max(0, Math.floor(y));
  const sw = Math.min(source.width - sx, Math.floor(width));
  const sh = Math.min(source.height - sy, Math.floor(height));
  if (sw < 8 || sh < 8) return null;

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  canvas.getContext('2d').drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

function upscaleCanvas(source, scale = 2) {
  const canvas = document.createElement('canvas');
  canvas.width = source.width * scale;
  canvas.height = source.height * scale;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function captureRegions(canvas) {
  const { width: w, height: h } = canvas;
  const regions = [{ label: 'full', canvas }];

  const centerBand = cropCanvas(canvas, { x: 0, y: h * 0.32, width: w, height: h * 0.36 });
  if (centerBand) regions.push({ label: 'center-band', canvas: centerBand });

  const lowerBand = cropCanvas(canvas, { x: w * 0.04, y: h * 0.52, width: w * 0.92, height: h * 0.38 });
  if (lowerBand) regions.push({ label: 'lower-band', canvas: lowerBand });

  const upperBand = cropCanvas(canvas, { x: w * 0.04, y: h * 0.12, width: w * 0.92, height: h * 0.32 });
  if (upperBand) regions.push({ label: 'upper-band', canvas: upperBand });

  return regions;
}

async function canvasToJpegFile(canvas, name = 'isbn-capture.jpg') {
  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error('Could not capture camera frame.'));
      },
      'image/jpeg',
      0.95,
    );
  });
  return new File([blob], name, { type: 'image/jpeg' });
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
        tessedit_char_whitelist: '0123456789XxISBN-: ',
      });
      return worker;
    })();
  }
  return ocrWorkerPromise;
}

function validIsbnFromBarcode(decoded) {
  const normalized = normalizeIsbn(decoded);
  if (!normalized || !isValidIsbn(normalized)) return null;
  return normalized;
}

async function scanBarcodeFromFile(file) {
  ensureTempScannerElement();
  const scanner = new Html5Qrcode(TEMP_SCANNER_ID, {
    verbose: false,
    formatsToSupport: ISBN_BARCODE_FORMATS,
    useBarCodeDetectorIfSupported: true,
  });

  try {
    const decoded = await scanner.scanFile(file, false);
    return validIsbnFromBarcode(decoded);
  } catch {
    return null;
  } finally {
    try {
      scanner.clear();
    } catch {
      // scanFile may already clear the temp element.
    }
  }
}

async function ocrIsbnFromFile(file, worker) {
  for (const psm of OCR_MODES) {
    await worker.setParameters({ tessedit_pageseg_mode: psm });
    const {
      data: { text },
    } = await worker.recognize(file);
    const fromText = extractIsbnFromText(text);
    if (fromText) return fromText;
  }
  return null;
}

async function readIsbnFromCanvas(canvas) {
  const worker = await getOcrWorker();
  const regions = captureRegions(canvas);

  for (const region of regions) {
    const file = await canvasToJpegFile(region.canvas, `isbn-${region.label}.jpg`);
    const fromBarcode = await scanBarcodeFromFile(file);
    if (fromBarcode) return fromBarcode;

    const fromOcr = await ocrIsbnFromFile(file, worker);
    if (fromOcr) return fromOcr;

    if (region.label !== 'full') {
      const upscaled = upscaleCanvas(region.canvas);
      const upscaledFile = await canvasToJpegFile(upscaled, `isbn-${region.label}-2x.jpg`);
      const fromUpscaledBarcode = await scanBarcodeFromFile(upscaledFile);
      if (fromUpscaledBarcode) return fromUpscaledBarcode;

      const fromUpscaledOcr = await ocrIsbnFromFile(upscaledFile, worker);
      if (fromUpscaledOcr) return fromUpscaledOcr;
    }
  }

  throw new Error(
    'No ISBN found. Line up the barcode in the wide scan box, tap to focus, hold steady, then try Capture ISBN again.',
  );
}

async function readIsbnFromStillImage(file) {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close();
  return readIsbnFromCanvas(canvas);
}

/** Grab a still JPEG from the live scanner without stopping the camera. */
export async function captureIsbnFrame(scannerId) {
  const video = getScannerVideoElement(scannerId);
  const canvas = captureVideoFrame(video);
  return canvasToJpegFile(canvas);
}

/** Capture the live camera frame and read ISBN from barcode or printed text. */
export async function captureIsbnFromScanner(scannerId) {
  const video = getScannerVideoElement(scannerId);
  const canvas = captureVideoFrame(video);
  return readIsbnFromCanvas(canvas);
}

/** Read ISBN from an uploaded photo. */
export async function readIsbnFromPhotoFile(file) {
  return readIsbnFromStillImage(file);
}

/** Validate a live barcode scan before lookup. */
export function normalizeScannedIsbn(raw) {
  const normalized = normalizeIsbn(raw);
  if (!normalized || !isValidIsbn(normalized)) return null;
  return normalized;
}
