import { useCallback, useMemo, useState } from 'react';
import { GreenApiClient } from '../api/greenApi';
import { useChatStore } from '../hooks/useChatStore';
import { useNotificationPolling } from '../hooks/useNotificationPolling';
import { notificationToAction } from '../store/notifications';
import type { Chat, Credentials, Message, NotificationBody } from '../types';
import { ChatWindow } from './ChatWindow';
import { NewChatDialog } from './NewChatDialog';
import { Sidebar } from './Sidebar';

interface MessengerProps {
  credentials: Credentials;
  onLogout: () => void;
}

const localId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function Messenger({ credentials, onLogout }: MessengerProps) {
  const client = useMemo(() => new GreenApiClient(credentials), [credentials]);
  const [state, dispatch] = useChatStore(credentials.idInstance);
  const [isNewChatOpen, setNewChatOpen] = useState(false);

  const handleNotification = useCallback(
    (body: NotificationBody) => {
      const action = notificationToAction(body);
      if (action) dispatch(action);
    },
    [dispatch],
  );

  const pollingStatus = useNotificationPolling(client, handleNotification);

  const deliver = useCallback(
    async (chatId: string, text: string, tempId: string) => {
      try {
        const { idMessage } = await client.sendMessage(chatId, text);
        dispatch({ type: 'message/confirm', tempId, id: idMessage });
      } catch (error) {
        console.error('sendMessage failed', error);
        dispatch({ type: 'message/status', chatId, id: tempId, status: 'failed' });
      }
    },
    [client, dispatch],
  );

  const activeChat = state.chats.find((chat) => chat.id === state.activeChatId) ?? null;

  const handleSend = useCallback(
    (text: string) => {
      if (!activeChat) return;
      const message: Message = {
        id: localId(),
        chatId: activeChat.id,
        text,
        direction: 'outgoing',
        timestamp: Math.floor(Date.now() / 1000),
        status: 'pending',
      };
      dispatch({ type: 'message/add', message });
      void deliver(activeChat.id, text, message.id);
    },
    [activeChat, deliver, dispatch],
  );

  const handleRetry = useCallback(
    (message: Message) => {
      dispatch({
        type: 'message/status',
        chatId: message.chatId,
        id: message.id,
        status: 'pending',
      });
      void deliver(message.chatId, message.text, message.id);
    },
    [deliver, dispatch],
  );

  const handleCreateChat = (chat: Omit<Chat, 'unread'>) => {
    dispatch({ type: 'chat/open', chat });
    setNewChatOpen(false);
  };

  return (
    <div className={`messenger${activeChat ? ' messenger--chat-open' : ''}`}>
      <Sidebar
        chats={state.chats}
        messages={state.messages}
        activeChatId={state.activeChatId}
        idInstance={credentials.idInstance}
        pollingStatus={pollingStatus}
        onSelect={(chatId) => dispatch({ type: 'chat/select', chatId })}
        onNewChat={() => setNewChatOpen(true)}
        onLogout={onLogout}
      />

      {activeChat ? (
        <ChatWindow
          chat={activeChat}
          messages={state.messages[activeChat.id] ?? []}
          onSend={handleSend}
          onRetry={handleRetry}
          onBack={() => dispatch({ type: 'chat/select', chatId: null })}
          onDelete={() => dispatch({ type: 'chat/remove', chatId: activeChat.id })}
        />
      ) : (
        <section className="placeholder">
          <p>Выберите чат или создайте новый</p>
        </section>
      )}

      {isNewChatOpen && (
        <NewChatDialog
          client={client}
          onCreate={handleCreateChat}
          onClose={() => setNewChatOpen(false)}
        />
      )}
    </div>
  );
}
