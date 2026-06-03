import { Link } from 'react-router-dom';

const linkStyle = {
  fontSize: 'var(--font-body)',
  fontWeight: 600,
  color: 'var(--color-primary)',
  textDecoration: 'none',
};

/** Secondary navigation — use buttons for primary actions. */
export function TextLink({ to, children, center = false, style, ...props }) {
  return (
    <Link
      to={to}
      style={{
        ...linkStyle,
        ...(center ? { display: 'block', textAlign: 'center' } : null),
        ...style,
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export { linkStyle as textLinkStyle };
