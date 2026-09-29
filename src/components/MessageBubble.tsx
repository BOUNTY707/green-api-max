import { memo } from 'react';
import type { Message } from '../types';
import { formatTime } from '../utils/format';
import { AlertIcon, CheckIcon, ClockIcon, DoubleCheckIcon } from './icons';

interface MessageBubbleProps {
  message: Message;
  onRetry?: (message: Message) => void;
}

function StatusIcon({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending':
      return <ClockIcon aria-label="Отправляется" />;
    case 'sent':
      return <CheckIcon aria-label="Отправлено" />;
    case 'delivered':
      return <DoubleCheckIcon aria-label="Доставлено" />;
    case 'read':
      return <DoubleCheckIcon className="bubble__read" aria-label="Прочитано" />;
    case 'failed':
      return <AlertIcon className="bubble__failed" aria-label="Ошибка отправки" />;
    default:
      return null;
  }
}

export const MessageBubble = memo(function MessageBubble({ message, onRetry }: MessageBubbleProps) {
  const outgoing = message.direction === 'outgoing';
  const failed = message.status === 'failed';

  return (
    <div className={`bubble-row bubble-row--${message.direction}`}>
      <div className={`bubble bubble--${message.direction}`}>
        <p className="bubble__text">{message.text}</p>
        <span className="bubble__meta">
          {formatTime(message.timestamp)}
          {outgoing && <StatusIcon status={message.status} />}
        </span>
      </div>
      {failed && onRetry && (
        <button className="bubble__retry" onClick={() => onRetry(message)}>
          Не отправлено. Повторить
        </button>
      )}
    </div>
  );
});
