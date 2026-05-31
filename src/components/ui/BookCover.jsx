export function BookCover({ src, alt = '', width = 120, style }) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        style={{
          aspectRatio: '2 / 3',
          objectFit: 'cover',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-border)',
          ...style,
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width,
        aspectRatio: '2 / 3',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted)',
        fontSize: 'var(--font-label)',
        ...style,
      }}
    >
      No cover
    </div>
  );
}
