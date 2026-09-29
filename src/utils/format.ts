export function formatTime(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatChatDate(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp * 1000);
  if (date.toDateString() === now.toDateString()) return formatTime(timestamp);
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
}

export function formatDayLabel(timestamp: number, now = new Date()): string {
  const date = new Date(timestamp * 1000);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'Сегодня';
  if (date.toDateString() === yesterday.toDateString()) return 'Вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

export function initials(name: string): string {
  // Phone-only names ("+7 999 ...") get a generic avatar instead of digits
  const letters = name
    .replace(/[^\p{L}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('');
  return letters;
}

const AVATAR_COLORS = ['#ff7a59', '#7c5cff', '#2bb3ff', '#00c389', '#ffb020', '#ff4d8d', '#4f7cff'];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}
