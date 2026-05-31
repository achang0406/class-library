export function Spinner({ size = 24, style }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width: size,
        height: size,
        border: '3px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'cl-spin 0.7s linear infinite',
        ...style,
      }}
    />
  );
}
