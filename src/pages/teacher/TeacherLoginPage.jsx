import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button.jsx';
import { PasscodeInput } from '../../components/ui/PasscodeInput.jsx';
import { Stack } from '../../components/ui/Stack.jsx';
import { Text } from '../../components/ui/Text.jsx';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { useTeacherSession } from '../../components/layout/TeacherSessionProvider.jsx';
import {
  isTeacherPasscodeConfigured,
  verifyTeacherPasscode,
} from '../../lib/teacherSession.js';

export default function TeacherLoginPage() {
  const navigate = useNavigate();
  const { isTeacher, signIn } = useTeacherSession();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');

  if (isTeacher) {
    return <Navigate to="/teacher/dashboard" replace />;
  }

  function trySignIn(code) {
    if (!isTeacherPasscodeConfigured()) {
      setError('Teacher passcode is not configured. Set VITE_TEACHER_PASSCODE to a 4-digit code.');
      return;
    }
    if (verifyTeacherPasscode(code)) {
      signIn();
      navigate('/teacher/dashboard');
      return;
    }
    setError('Incorrect passcode.');
    setPasscode('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    trySignIn(passcode);
  }

  return (
    <PageContainer narrow>
      <Stack gap="var(--space-5)" style={{ paddingTop: 'var(--space-8)' }}>
        <Stack gap="var(--space-2)" align="center" style={{ textAlign: 'center' }}>
          <Text as="h1" variant="title">
            Teacher Login
          </Text>
          <Text variant="body" style={{ color: 'var(--color-text-muted)' }}>
            Enter your 4-digit passcode to manage the library.
          </Text>
        </Stack>
        <form onSubmit={handleSubmit}>
          <Stack gap="var(--space-4)">
            <PasscodeInput
              value={passcode}
              onChange={(next) => {
                setPasscode(next);
                setError('');
              }}
              onComplete={trySignIn}
            />
            {error ? (
              <Text style={{ color: 'var(--color-overdue)', textAlign: 'center' }}>{error}</Text>
            ) : null}
            <Button type="submit" variant="primary" fullWidth disabled={passcode.length !== 4}>
              Sign In
            </Button>
          </Stack>
        </form>
      </Stack>
    </PageContainer>
  );
}
