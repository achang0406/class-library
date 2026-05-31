export function PageContainer({ narrow = false, style, children, ...props }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: narrow ? '480px' : 'var(--max-content)',
        margin: '0 auto',
        padding: 'var(--layout-gutter)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
