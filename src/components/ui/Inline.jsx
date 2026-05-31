export function Inline({
  gap = 'var(--space-2)',
  wrap = false,
  align = 'center',
  style,
  children,
  ...props
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: wrap ? 'wrap' : 'nowrap',
        alignItems: align,
        gap,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
