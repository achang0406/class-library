const VARIANTS = {
  available: { bg: 'var(--color-available)', color: 'var(--color-card)' },
  'checked-out': { bg: 'var(--color-checked-out)', color: 'var(--color-card)' },
  overdue: { bg: 'var(--color-overdue)', color: 'var(--color-card)' },
  'needs-label': { bg: 'var(--color-accent)', color: 'var(--color-text)' },
  neutral: { bg: 'var(--color-border)', color: 'var(--color-text)' },
};

export function Badge({ variant = 'neutral', children, style }) {
  const v = VARIANTS[variant] ?? VARIANTS.neutral;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: 'var(--space-1) var(--space-2)',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--font-label)',
        fontWeight: 700,
        background: v.bg,
        color: v.color,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}
