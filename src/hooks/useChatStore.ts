import { useEffect, useReducer } from 'react';
import { chatReducer, initialChatState, type ChatState } from '../store/chatReducer';
import { storage } from '../utils/storage';

const storageKey = (idInstance: string) => `max-chat:history:${idInstance}`;

/** Chat state persisted per instance, so history survives a page reload. */
export function useChatStore(idInstance: string) {
  const [state, dispatch] = useReducer(chatReducer, idInstance, (id): ChatState => {
    const saved = storage.get<ChatState>(storageKey(id));
    return saved ? { ...initialChatState, ...saved, activeChatId: null } : initialChatState;
  });

  useEffect(() => {
    storage.set(storageKey(idInstance), { chats: state.chats, messages: state.messages });
  }, [idInstance, state.chats, state.messages]);

  return [state, dispatch] as const;
}
