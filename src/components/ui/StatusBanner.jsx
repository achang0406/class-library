import { Stack } from './Stack.jsx';
import { Text } from './Text.jsx';

const VARIANTS = {
  success: {
    border: 'var(--color-available)',
    background: 'color-mix(in srgb, var(--color-available) 14%, var(--color-card))',
    titleColor: 'var(--color-primary)',
  },
  notice: {
    border: 'var(--color-accent)',
    background: 'color-mix(in srgb, var(--color-accent) 18%, var(--color-card))',
    titleColor: 'var(--color-text)',
  },
  error: {
    border: 'var(--color-overdue)',
    background: 'color-mix(in srgb, var(--color-overdue) 10%, var(--color-card))',
    titleColor: 'var(--color-overdue)',
  },
};

export function StatusBanner({
  variant = 'success',
  title,
  children,
  role = 'status',
  style,
}) {
  const tokens = VARIANTS[variant] ?? VARIANTS.success;

  return (
    <Stack
      gap="var(--space-1)"
      role={role}
      aria-live="polite"
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-sm)',
        border: `2px solid ${tokens.border}`,
        background: tokens.background,
        ...style,
      }}
    >
      {title ? (
        <Text variant="emphasis" style={{ color: tokens.titleColor }}>
          {title}
        </Text>
      ) : null}
      {children}
    </Stack>
  );
}
