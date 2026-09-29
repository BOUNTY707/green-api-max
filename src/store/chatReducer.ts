import type { Chat, Message, MessageStatus } from '../types';

export interface ChatState {
  chats: Chat[];
  /** messages grouped by chatId */
  messages: Record<string, Message[]>;
  activeChatId: string | null;
}

export const initialChatState: ChatState = {
  chats: [],
  messages: {},
  activeChatId: null,
};

export type ChatAction =
  | { type: 'chat/open'; chat: Omit<Chat, 'unread'> }
  | { type: 'chat/select'; chatId: string | null }
  | { type: 'chat/remove'; chatId: string }
  | { type: 'message/add'; message: Message; senderName?: string; senderPhone?: string }
  | { type: 'message/confirm'; tempId: string; id: string }
  | { type: 'message/status'; chatId: string; id: string; status: MessageStatus };

const STATUS_WEIGHT: Record<MessageStatus, number> = {
  failed: -1,
  pending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
};

function findChatIndex(chats: Chat[], chatId: string, phone?: string): number {
  const byId = chats.findIndex((chat) => chat.id === chatId);
  if (byId !== -1 || !phone) return byId;
  return chats.findIndex((chat) => chat.phone === phone);
}

/** Moves the chat to the top of the list (most recent first). */
function bump(chats: Chat[], index: number, patch: Partial<Chat> = {}): Chat[] {
  const chat = { ...chats[index]!, ...patch };
  return [chat, ...chats.slice(0, index), ...chats.slice(index + 1)];
}

function rekeyChat(state: ChatState, fromId: string, toId: string): ChatState {
  const { [fromId]: list = [], ...rest } = state.messages;
  return {
    chats: state.chats.map((c) => (c.id === fromId ? { ...c, id: toId } : c)),
    messages: { ...rest, [toId]: list.map((m) => ({ ...m, chatId: toId })) },
    activeChatId: state.activeChatId === fromId ? toId : state.activeChatId,
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'chat/open': {
      const { chat } = action;
      const index = findChatIndex(state.chats, chat.id, chat.phone);
      if (index !== -1) {
        const existing = state.chats[index]!;
        return {
          ...state,
          chats: state.chats.map((c, i) => (i === index ? { ...c, unread: 0 } : c)),
          activeChatId: existing.id,
        };
      }
      return {
        ...state,
        chats: [{ ...chat, unread: 0 }, ...state.chats],
        messages: { ...state.messages, [chat.id]: state.messages[chat.id] ?? [] },
        activeChatId: chat.id,
      };
    }

    case 'chat/select':
      return {
        ...state,
        activeChatId: action.chatId,
        chats: state.chats.map((chat) =>
          chat.id === action.chatId ? { ...chat, unread: 0 } : chat,
        ),
      };

    case 'chat/remove': {
      const { [action.chatId]: _removed, ...messages } = state.messages;
      return {
        chats: state.chats.filter((chat) => chat.id !== action.chatId),
        messages,
        activeChatId: state.activeChatId === action.chatId ? null : state.activeChatId,
      };
    }

    case 'message/add': {
      const { message, senderName, senderPhone } = action;

      // Already known message (e.g. webhook echo of a message sent from this UI)
      const ownerId = Object.keys(state.messages).find((id) =>
        state.messages[id]!.some((m) => m.id === message.id),
      );
      if (ownerId !== undefined) {
        // A chat created by phone ("7999...@c.us") learns its real MAX chatId here
        const canRekey =
          ownerId !== message.chatId && !state.chats.some((c) => c.id === message.chatId);
        return canRekey ? rekeyChat(state, ownerId, message.chatId) : state;
      }

      let chats = state.chats;
      let chatId = message.chatId;
      const index = findChatIndex(chats, chatId, senderPhone);

      if (index === -1) {
        chats = [
          {
            id: chatId,
            name: senderName || (senderPhone ? `+${senderPhone}` : chatId),
            phone: senderPhone,
            unread: 0,
          },
          ...chats,
        ];
      } else {
        const existing = chats[index]!;
        chatId = existing.id;
        chats = bump(chats, index);
      }

      const list = state.messages[chatId] ?? [];
      const isActive = state.activeChatId === chatId;
      if (message.direction === 'incoming' && !isActive) {
        chats = chats.map((c) => (c.id === chatId ? { ...c, unread: c.unread + 1 } : c));
      }

      const next = [...list, { ...message, chatId }].sort((a, b) => a.timestamp - b.timestamp);
      return { ...state, chats, messages: { ...state.messages, [chatId]: next } };
    }

    case 'message/confirm': {
      // The chat may have been re-keyed while the request was in flight
      const ownerId = Object.keys(state.messages).find((id) =>
        state.messages[id]!.some((m) => m.id === action.tempId),
      );
      if (ownerId === undefined) return state;
      const list = state.messages[ownerId]!;
      // The webhook with the real id may have arrived before the HTTP response
      const alreadyKnown = Object.values(state.messages).some((l) =>
        l.some((m) => m.id === action.id),
      );
      const next = alreadyKnown
        ? list.filter((m) => m.id !== action.tempId)
        : list.map((m) =>
            m.id === action.tempId ? { ...m, id: action.id, status: 'sent' as const } : m,
          );
      return { ...state, messages: { ...state.messages, [ownerId]: next } };
    }

    case 'message/status': {
      // Status webhooks may carry a different chatId format, so search by message id
      const targets = [
        action.chatId,
        ...Object.keys(state.messages).filter((id) => id !== action.chatId),
      ];
      let changed = false;
      const messages = { ...state.messages };
      for (const id of targets) {
        const list = messages[id];
        if (!list) continue;
        messages[id] = list.map((m) => {
          if (m.id !== action.id) return m;
          const current = m.status ?? 'pending';
          if (
            action.status !== 'failed' &&
            STATUS_WEIGHT[action.status] <= STATUS_WEIGHT[current]
          ) {
            return m;
          }
          if (action.status === 'failed' && current === 'failed') return m;
          changed = true;
          return { ...m, status: action.status };
        });
      }
      return changed ? { ...state, messages } : state;
    }

    default:
      return state;
  }
}
