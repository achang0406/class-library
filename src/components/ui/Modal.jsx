import { Button } from './Button.jsx';

export function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
        background: 'rgba(27, 67, 50, 0.45)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 'var(--max-content)',
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          boxShadow: '0 16px 48px rgba(27, 67, 50, 0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <h2
            id="modal-title"
            style={{ margin: '0 0 var(--space-4)', fontSize: 'var(--font-title)' }}
          >
            {title}
          </h2>
        ) : null}
        <div>{children}</div>
        {footer ?? (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
