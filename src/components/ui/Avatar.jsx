export function Avatar({ name, size = 48, style }) {
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'var(--color-primary)',
        color: 'var(--color-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.4,
        flexShrink: 0,
        ...style,
      }}
    >
      {initial}
    </div>
  );
}
