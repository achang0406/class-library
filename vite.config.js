import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectRegister: null,
      devOptions: {
        enabled: false,
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,wasm,gz}'],
        globIgnores: ['**/tesseract/**'],
      },
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Class Library',
        short_name: 'Library',
        description: 'Classroom library catalog with checkout kiosk.',
        theme_color: '#2D6A4F',
        background_color: '#FFFBF5',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
    }),
  ],
});
