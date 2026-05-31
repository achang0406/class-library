import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { setTeacherLoggedIn, verifyTeacherPassword } from '../../lib/teacherSession.js';

export default function TeacherLoginPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (verifyTeacherPassword(password)) {
      setTeacherLoggedIn(true);
      navigate('/teacher/dashboard');
      return;
    }
    setError('Incorrect password.');
  }

  return (
    <PageContainer narrow>
      <Stack gap="var(--space-5)" style={{ paddingTop: 'var(--space-8)' }}>
        <Stack gap="var(--space-2)">
          <Text as="h1" variant="title">
            Teacher Login
          </Text>
          <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
            Enter password to manage your library.
          </Text>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack gap="var(--space-4)">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {error ? <Text style={{ color: 'var(--color-overdue)' }}>{error}</Text> : null}
            <Button type="submit" variant="primary" fullWidth>
              Sign In
            </Button>
          </Stack>
        </form>
      </Stack>
    </PageContainer>
  );
}
