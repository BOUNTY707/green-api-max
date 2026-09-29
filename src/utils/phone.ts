/** Keeps digits only and converts Russian "8XXXXXXXXXX" to "7XXXXXXXXXX". */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) {
    digits = `7${digits.slice(1)}`;
  }
  return digits;
}

export function isValidPhone(phone: string): boolean {
  return /^\d{10,15}$/.test(phone);
}

/** "79991234567" -> "+7 999 123-45-67" (falls back to "+<digits>") */
export function formatPhone(phone: string): string {
  const match = /^7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  if (match) return `+7 ${match[1]} ${match[2]}-${match[3]}-${match[4]}`;
  return `+${phone}`;
}

/** "79991234567@c.us" -> "79991234567" */
export function phoneFromChatId(chatId: string): string | undefined {
  const match = /^(\d+)@c\.us$/.exec(chatId);
  return match?.[1];
}
