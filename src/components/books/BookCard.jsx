import { Link } from 'react-router-dom';
import { Badge } from '../ui/Badge.jsx';
import { BookCover } from '../ui/BookCover.jsx';
import { Card } from '../ui/Card.jsx';
import { Text } from '../ui/Text.jsx';
import { formatLexile } from '../../lib/lexile.js';

export function BookCard({ book }) {
  const badgeVariant = book.status === 'available' ? 'available' : 'checked-out';

  return (
    <Link to={`/books/${book.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          height: '100%',
          padding: 'var(--space-3)',
        }}
      >
        <BookCover src={book.cover_url} alt={book.title} width="100%" style={{ width: '100%' }} />
        <Text
          variant="emphasis"
          style={{
            lineClamp: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {book.title}
        </Text>
        <Text variant="label">{book.author ?? 'Unknown author'}</Text>
        {book.lexile != null || book.reading_level ? (
          <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
            {book.lexile != null ? formatLexile(book.lexile) : ''}
            {book.lexile != null && book.reading_level ? ' · ' : ''}
            {book.reading_level ?? ''}
          </Text>
        ) : null}
        {book.activeCheckout ? (
          <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
            Out to {book.activeCheckout.borrower_name}
            {book.activeCheckout.borrower_type !== 'student'
              ? ` (${book.activeCheckout.borrower_type})`
              : ''}
          </Text>
        ) : null}
        <Badge variant={badgeVariant}>
          {book.status === 'available' ? 'Available' : 'Checked out'}
        </Badge>
        {!book.label_printed_at ? <Badge variant="needs-label">Needs label</Badge> : null}
      </Card>
    </Link>
  );
}
