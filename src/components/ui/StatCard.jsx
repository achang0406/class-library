import { Card } from './Card.jsx';
import { Stack } from './Stack.jsx';
import { Text } from './Text.jsx';

export function StatCard({ label, value, detail }) {
  return (
    <Card style={{ flex: '1 1 100px', minWidth: 100 }}>
      <Stack gap="var(--space-2)">
        <Text variant="display" style={{ fontSize: 'var(--font-title)', lineHeight: 1.1 }}>
          {value}
        </Text>
        <Text variant="label">{label}</Text>
        {detail ? (
          <Text variant="label" style={{ color: 'var(--color-text-muted)' }}>
            {detail}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
}
