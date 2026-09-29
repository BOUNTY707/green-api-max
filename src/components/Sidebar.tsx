import { useMemo, useState, type ReactNode } from 'react';
import type { PollingStatus } from '../hooks/useNotificationPolling';
import type { Chat, Message } from '../types';
import { formatChatDate } from '../utils/format';
import { Avatar } from './Avatar';
import { LogoutIcon, PlusIcon, SearchIcon } from './icons';

interface SidebarProps {
  chats: Chat[];
  messages: Record<string, Message[]>;
  activeChatId: string | null;
  idInstance: string;
  pollingStatus: PollingStatus;
  onSelect: (chatId: string) => void;
  onNewChat: () => void;
  onLogout: () => void;
  /** Optional notice rendered under the header (e.g. settings warning) */
  notice?: ReactNode;
}

const STATUS_TEXT: Record<PollingStatus, string> = {
  connecting: 'Подключение…',
  online: 'В сети',
  error: 'Нет соединения, переподключаемся…',
};

export function Sidebar({
  chats,
  messages,
  activeChatId,
  idInstance,
  pollingStatus,
  onSelect,
  onNewChat,
  onLogout,
  notice,
}: SidebarProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return chats;
    const digits = q.replace(/\D/g, '');
    return chats.filter(
      (chat) =>
        chat.name.toLowerCase().includes(q) || (digits !== '' && chat.phone?.includes(digits)),
    );
  }, [chats, query]);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <div>
          <h1 className="sidebar__title">Чаты</h1>
          <p className={`status status--${pollingStatus}`}>
            <span className="status__dot" />
            {STATUS_TEXT[pollingStatus]} · {idInstance}
          </p>
        </div>
        <div className="sidebar__actions">
          <button
            className="icon-button"
            onClick={onNewChat}
            aria-label="Новый чат"
            title="Новый чат"
          >
            <PlusIcon />
          </button>
          <button className="icon-button" onClick={onLogout} aria-label="Выйти" title="Выйти">
            <LogoutIcon />
          </button>
        </div>
      </header>

      {notice}

      <label className="search">
        <SearchIcon width={18} height={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск"
          aria-label="Поиск по чатам"
        />
      </label>

      {filtered.length > 0 && (
        <ul className="chat-list">
          {filtered.map((chat) => {
            const last = messages[chat.id]?.at(-1);
            return (
              <li key={chat.id}>
                <button
                  className={`chat-item${chat.id === activeChatId ? ' chat-item--active' : ''}`}
                  onClick={() => onSelect(chat.id)}
                >
                  <Avatar name={chat.name} seed={chat.phone ?? chat.id} />
                  <span className="chat-item__body">
                    <span className="chat-item__row">
                      <span className="chat-item__name">{chat.name}</span>
                      {last && (
                        <span className="chat-item__time">{formatChatDate(last.timestamp)}</span>
                      )}
                    </span>
                    <span className="chat-item__row">
                      <span className="chat-item__preview">
                        {last
                          ? `${last.direction === 'outgoing' ? 'Вы: ' : ''}${last.text}`
                          : 'Нет сообщений'}
                      </span>
                      {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {chats.length === 0 && (
        <div className="sidebar__empty">
          <p>У вас пока нет чатов</p>
          <button className="button button--primary" onClick={onNewChat}>
            Начать чат
          </button>
        </div>
      )}
      {chats.length > 0 && filtered.length === 0 && (
        <p className="sidebar__empty">Ничего не найдено</p>
      )}
    </aside>
  );
}
