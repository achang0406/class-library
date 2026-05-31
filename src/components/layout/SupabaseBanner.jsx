import { isSupabaseConfigured } from '../../lib/supabase.js';
import { Card } from '../ui/Card.jsx';
import { Text } from '../ui/Text.jsx';

export function SupabaseBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <Card style={{ background: '#fff3cd', borderColor: '#ffc107', marginBottom: 'var(--space-4)' }}>
      <Text variant="emphasis">Database not connected</Text>
      <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
        Copy <code>.env.example</code> to <code>.env.local</code> and add your Supabase URL and anon
        key. Run the SQL in <code>supabase/migrations/001_initial_schema.sql</code> in the Supabase
        SQL editor.
      </Text>
    </Card>
  );
}
