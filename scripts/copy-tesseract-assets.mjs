import { cp, mkdir, readdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dest = join(root, 'public/tesseract');
const tessdataDest = join(dest, 'tessdata');

await mkdir(tessdataDest, { recursive: true });

await cp(
  join(root, 'node_modules/tesseract.js/dist/worker.min.js'),
  join(dest, 'worker.min.js'),
);

const coreDir = join(root, 'node_modules/tesseract.js-core');
for (const name of await readdir(coreDir)) {
  if (name.startsWith('tesseract-core') && (name.endsWith('.wasm.js') || name.endsWith('.wasm'))) {
    await cp(join(coreDir, name), join(dest, name));
  }
}

await cp(
  join(root, 'node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'),
  join(tessdataDest, 'eng.traineddata.gz'),
);

console.log('Copied Tesseract OCR assets to public/tesseract/');
