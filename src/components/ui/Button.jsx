const VARIANTS = {
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-card)',
    border: '1px solid transparent',
  },
  secondary: {
    background: 'var(--color-card)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  accent: {
    background: 'var(--color-accent)',
    color: 'var(--color-text)',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-primary)',
    border: '1px solid transparent',
  },
  kiosk: {
    background: 'var(--color-accent)',
    color: 'var(--color-text)',
    border: '1px solid transparent',
    minHeight: 'var(--space-8)',
    fontSize: 'var(--font-emphasis)',
    fontWeight: 700,
    padding: 'var(--space-5) var(--space-6)',
  },
};

export function Button({
  variant = 'primary',
  type = 'button',
  disabled = false,
  loading = false,
  style,
  children,
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        minHeight: variant === 'kiosk' ? undefined : '44px',
        padding: variant === 'kiosk' ? undefined : 'var(--space-3) var(--space-5)',
        borderRadius: 'var(--radius-md)',
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled || loading ? 0.6 : 1,
        width: props.fullWidth ? '100%' : undefined,
        ...v,
        ...style,
      }}
      {...props}
    >
      {loading ? '…' : children}
    </button>
  );
}
