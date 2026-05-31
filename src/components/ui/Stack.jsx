export function Stack({
  gap = 'var(--layout-stack-gap)',
  align = 'stretch',
  style,
  children,
  ...props
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
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
