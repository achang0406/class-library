import { TOKEN_CSS } from './tokens.js';
import { BP_LG_MIN, BP_SM_MIN } from '../constants/breakpoints.js';

export const globalStyles = `
  :root {
    ${TOKEN_CSS}
  }

  @media (min-width: ${BP_SM_MIN}px) {
    :root {
      --font-label: 12px;
      --font-body: 15px;
      --font-emphasis: 17px;
      --font-title: 22px;
      --font-display: 32px;
      --layout-gutter: var(--space-5);
    }
  }

  @media (min-width: ${BP_LG_MIN}px) {
    :root {
      --font-label: 13px;
      --font-body: 16px;
      --font-emphasis: 18px;
      --font-title: 24px;
      --font-display: 36px;
      --max-content: 960px;
    }
  }

  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    margin: 0;
    background: var(--color-surface);
    color: var(--color-text);
    font-family: var(--font-sans);
    font-size: var(--font-body);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  body {
    margin: 0;
    min-height: 100dvh;
    background: var(--color-surface);
    color: var(--color-text);
    padding-top: var(--safe-area-top);
    padding-bottom: var(--safe-area-bottom);
  }

  #root {
    min-height: 100dvh;
  }

  a {
    color: var(--color-primary);
    text-decoration: none;
  }

  a:hover {
    color: var(--color-primary-hover);
  }

  button, input, select, textarea {
    font: inherit;
  }

  input:not([type='checkbox']):not([type='file']):not([type='radio']),
  select,
  textarea {
    font-size: var(--font-input);
  }

  img {
    max-width: 100%;
    display: block;
  }
`;
