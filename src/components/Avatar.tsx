import { avatarColor, initials } from '../utils/format';
import { UserIcon } from './icons';

interface AvatarProps {
  name: string;
  seed: string;
  size?: number;
}

export function Avatar({ name, seed, size = 48 }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{ width: size, height: size, background: avatarColor(seed), fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name) || <UserIcon width={size * 0.5} height={size * 0.5} />}
    </div>
  );
}
