import { describe, expect, it } from 'vitest';
import type { Message } from '../types';
import { chatReducer, initialChatState, type ChatState } from './chatReducer';
import { notificationToAction } from './notifications';

const msg = (patch: Partial<Message> = {}): Message => ({
  id: 'm1',
  chatId: '10000000',
  text: 'Привет',
  direction: 'incoming',
  timestamp: 1763115112,
  ...patch,
});

const withChat = (): ChatState =>
  chatReducer(initialChatState, {
    type: 'chat/open',
    chat: { id: '10000000', name: '+7 999 123-45-67', phone: '79991234567' },
  });

describe('chatReducer', () => {
  it('opens a new chat and makes it active', () => {
    const state = withChat();
    expect(state.chats).toHaveLength(1);
    expect(state.activeChatId).toBe('10000000');
  });

  it('does not duplicate a chat opened twice by the same phone', () => {
    const state = chatReducer(withChat(), {
      type: 'chat/open',
      chat: { id: '79991234567@c.us', name: 'x', phone: '79991234567' },
    });
    expect(state.chats).toHaveLength(1);
  });

  it('creates a chat for an incoming message from an unknown sender', () => {
    const state = chatReducer(initialChatState, {
      type: 'message/add',
      message: msg(),
      senderName: 'Иван',
    });
    expect(state.chats[0]).toMatchObject({ id: '10000000', name: 'Иван', unread: 1 });
  });

  it('ignores duplicated notifications', () => {
    let state = chatReducer(withChat(), { type: 'message/add', message: msg() });
    state = chatReducer(state, { type: 'message/add', message: msg() });
    expect(state.messages['10000000']).toHaveLength(1);
  });

  it('does not increase unread for the active chat', () => {
    const state = chatReducer(withChat(), { type: 'message/add', message: msg() });
    expect(state.chats[0]!.unread).toBe(0);
  });

  it('matches incoming message to a phone-based chat by sender phone', () => {
    let state = chatReducer(initialChatState, {
      type: 'chat/open',
      chat: { id: '79991234567@c.us', name: 'x', phone: '79991234567' },
    });
    state = chatReducer(state, {
      type: 'message/add',
      message: msg(),
      senderPhone: '79991234567',
    });
    expect(state.chats).toHaveLength(1);
    expect(state.messages['79991234567@c.us']).toHaveLength(1);
  });

  it('confirms an optimistic message with the real id', () => {
    let state = chatReducer(withChat(), {
      type: 'message/add',
      message: msg({ id: 'local-1', direction: 'outgoing', status: 'pending' }),
    });
    state = chatReducer(state, { type: 'message/confirm', tempId: 'local-1', id: 'real-1' });
    expect(state.messages['10000000']![0]).toMatchObject({ id: 'real-1', status: 'sent' });
  });

  it('re-keys a phone chat to the MAX chatId from the webhook echo', () => {
    let state = chatReducer(initialChatState, {
      type: 'chat/open',
      chat: { id: '79991234567@c.us', name: 'x', phone: '79991234567' },
    });
    state = chatReducer(state, {
      type: 'message/add',
      message: msg({ id: 'real-1', chatId: '79991234567@c.us', direction: 'outgoing' }),
    });
    state = chatReducer(state, {
      type: 'message/add',
      message: msg({ id: 'real-1', chatId: '10000000', direction: 'outgoing' }),
    });
    expect(state.chats[0]!.id).toBe('10000000');
    expect(state.activeChatId).toBe('10000000');
    expect(state.messages['10000000']).toHaveLength(1);
  });

  it('never downgrades a message status', () => {
    let state = chatReducer(withChat(), {
      type: 'message/add',
      message: msg({ direction: 'outgoing', status: 'read' }),
    });
    state = chatReducer(state, {
      type: 'message/status',
      chatId: '10000000',
      id: 'm1',
      status: 'delivered',
    });
    expect(state.messages['10000000']![0]!.status).toBe('read');
  });
});

describe('notificationToAction', () => {
  it('maps incomingMessageReceived (textMessage)', () => {
    const action = notificationToAction({
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1763115112,
      idMessage: 'abc',
      senderData: {
        chatId: '10000000',
        senderName: 'Иван',
        senderPhoneNumber: 79876543210,
      },
      messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'Привет' } },
    });
    expect(action).toMatchObject({
      type: 'message/add',
      message: { id: 'abc', text: 'Привет', direction: 'incoming' },
      senderName: 'Иван',
      senderPhone: '79876543210',
    });
  });

  it('maps extendedTextMessage', () => {
    const action = notificationToAction({
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1,
      idMessage: 'abc',
      senderData: { chatId: '1' },
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'link' },
      },
    });
    expect(action?.type === 'message/add' && action.message.text).toBe('link');
  });

  it('maps outgoingMessageStatus', () => {
    expect(
      notificationToAction({
        typeWebhook: 'outgoingMessageStatus',
        timestamp: 1,
        idMessage: 'abc',
        chatId: '1',
        status: 'read',
      }),
    ).toEqual({ type: 'message/status', chatId: '1', id: 'abc', status: 'read' });
  });

  it('ignores unrelated notifications', () => {
    expect(notificationToAction({ typeWebhook: 'stateInstanceChanged', timestamp: 1 })).toBeNull();
  });
});

describe('group chats', () => {
  it('ignores messages from groups and channels', () => {
    expect(
      notificationToAction({
        typeWebhook: 'incomingMessageReceived',
        timestamp: 1,
        idMessage: 'g1',
        senderData: { chatId: '-1002207127191' },
        messageData: { typeMessage: 'textMessage', textMessageData: { textMessage: 'hi' } },
      }),
    ).toBeNull();
  });
});

describe('read receipts', () => {
  it('marks earlier outgoing messages as read when the recipient replies', () => {
    let state = chatReducer(withChat(), {
      type: 'message/add',
      message: msg({ id: 'o1', direction: 'outgoing', status: 'sent', timestamp: 100 }),
    });
    state = chatReducer(state, {
      type: 'message/add',
      message: msg({ id: 'i1', direction: 'incoming', timestamp: 200 }),
    });
    expect(state.messages['10000000']![0]!.status).toBe('read');
  });

  it('maps Telegram noAccount status to failed', () => {
    expect(
      notificationToAction({
        typeWebhook: 'outgoingMessageStatus',
        timestamp: 1,
        idMessage: 'x',
        chatId: '1',
        status: 'noAccount',
      }),
    ).toMatchObject({ status: 'failed' });
  });
});
