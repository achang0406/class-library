export function Input({ label, id, style, ...props }) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <label
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', width: '100%' }}
    >
      {label ? (
        <span
          style={{
            fontSize: 'var(--font-label)',
            color: 'var(--color-text-muted)',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        style={{
          minHeight: '44px',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-input-bg)',
          color: 'var(--color-text)',
          width: '100%',
          fontSize: 'var(--font-input)',
          outline: 'none',
          ...style,
        }}
        {...props}
      />
    </label>
  );
}
