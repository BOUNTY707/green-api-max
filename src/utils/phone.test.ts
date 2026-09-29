import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, normalizePhone } from './phone';

describe('phone utils', () => {
  it('normalizes formatted numbers', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567');
    expect(normalizePhone('8 999 123 45 67')).toBe('79991234567');
  });

  it('validates length', () => {
    expect(isValidPhone('79991234567')).toBe(true);
    expect(isValidPhone('12345')).toBe(false);
  });

  it('formats russian numbers', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67');
    expect(formatPhone('998901234567')).toBe('+998901234567');
  });
});
