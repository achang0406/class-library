import { useRef } from 'react';

const cellStyle = {
  width: 52,
  height: 56,
  fontSize: 'var(--font-input)',
  fontFamily: 'var(--font-mono)',
  textAlign: 'center',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-input-bg)',
  color: 'var(--color-text)',
  outline: 'none',
};

export function PasscodeInput({
  length = 4,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  autoFocus = true,
}) {
  const refs = useRef([]);

  function focusIndex(index) {
    refs.current[index]?.focus();
  }

  function emit(next) {
    const trimmed = next.replace(/\D/g, '').slice(0, length);
    onChange(trimmed);
    if (trimmed.length === length) {
      onComplete?.(trimmed);
    }
  }

  function handleChange(index, raw) {
    const digit = raw.replace(/\D/g, '').slice(-1);
    const chars = value.padEnd(length, ' ').slice(0, length).split('');
    chars[index] = digit || ' ';
    const next = chars.join('').replace(/ /g, '').slice(0, length);
    emit(next);
    if (digit && index < length - 1) {
      focusIndex(index + 1);
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      e.preventDefault();
      const chars = value.split('');
      chars.pop();
      emit(chars.join(''));
      focusIndex(index - 1);
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    emit(pasted);
    focusIndex(Math.min(pasted.length, length - 1));
  }

  return (
    <div
      role="group"
      aria-label="4-digit passcode"
      style={{
        display: 'flex',
        gap: 'var(--space-2)',
        justifyContent: 'center',
        width: '100%',
      }}
    >
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="password"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          aria-label={`Passcode digit ${index + 1}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={cellStyle}
        />
      ))}
    </div>
  );
}
