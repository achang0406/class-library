const VARIANTS = {
  label: { fontSize: 'var(--font-label)', fontWeight: 500, color: 'var(--color-text-muted)' },
  body: { fontSize: 'var(--font-body)', fontWeight: 400, color: 'var(--color-text)' },
  emphasis: { fontSize: 'var(--font-emphasis)', fontWeight: 600, color: 'var(--color-text)' },
  title: { fontSize: 'var(--font-title)', fontWeight: 700, color: 'var(--color-text)' },
  display: { fontSize: 'var(--font-display)', fontWeight: 700, color: 'var(--color-text)' },
};

export function Text({ as: Tag = 'span', variant = 'body', style, children, ...props }) {
  return (
    <Tag style={{ margin: 0, ...VARIANTS[variant], ...style }} {...props}>
      {children}
    </Tag>
  );
}
