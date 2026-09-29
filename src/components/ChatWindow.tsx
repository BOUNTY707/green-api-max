import { Fragment, useEffect, useRef } from 'react';
import type { Chat, Message } from '../types';
import { formatDayLabel } from '../utils/format';
import { formatPhone } from '../utils/phone';
import { Avatar } from './Avatar';
import { BackIcon, TrashIcon } from './icons';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';

interface ChatWindowProps {
  chat: Chat;
  messages: Message[];
  onSend: (text: string) => void;
  onRetry: (message: Message) => void;
  onBack: () => void;
  onDelete: () => void;
}

export function ChatWindow({ chat, messages, onSend, onRetry, onBack, onDelete }: ChatWindowProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [chat.id, messages.length]);

  const subtitle = chat.phone ? formatPhone(chat.phone) : `ID ${chat.id}`;

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="icon-button chat__back" onClick={onBack} aria-label="Назад к чатам">
          <BackIcon />
        </button>
        <Avatar name={chat.name} seed={chat.phone ?? chat.id} size={40} />
        <div className="chat__title">
          <h2>{chat.name}</h2>
          {subtitle !== chat.name && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          onClick={() => {
            if (
              confirm('Удалить чат из списка? История сообщений будет удалена только локально.')
            ) {
              onDelete();
            }
          }}
          aria-label="Удалить чат"
          title="Удалить чат"
        >
          <TrashIcon width={20} height={20} />
        </button>
      </header>

      <div className="chat__messages" role="log" aria-live="polite">
        {messages.length === 0 && <p className="chat__empty">Напишите первое сообщение</p>}
        {messages.map((message, index) => {
          const day = formatDayLabel(message.timestamp);
          const prevDay = index > 0 ? formatDayLabel(messages[index - 1]!.timestamp) : null;
          return (
            <Fragment key={message.id}>
              {day !== prevDay && <div className="day-separator">{day}</div>}
              <MessageBubble message={message} onRetry={onRetry} />
            </Fragment>
          );
        })}
        <div ref={endRef} />
      </div>

      <MessageInput key={chat.id} onSend={onSend} />
    </section>
  );
}
