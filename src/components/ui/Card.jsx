export function Card({ as: Tag = 'div', padding = 'var(--space-4)', style, children, ...props }) {
  return (
    <Tag
      style={{
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        padding,
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
