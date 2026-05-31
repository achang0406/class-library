import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { globalStyles } from './styles/theme.js';

const style = document.createElement('style');
style.textContent = `${globalStyles}\n@keyframes cl-spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(style);

if (import.meta.env.PROD || import.meta.env.VITE_ENABLE_SW === 'true') {
  registerSW({ immediate: true });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
