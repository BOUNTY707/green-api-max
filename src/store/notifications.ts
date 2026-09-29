import type { MessageData, MessageStatus, NotificationBody } from '../types';
import type { ChatAction } from './chatReducer';

export function extractText(data?: MessageData): string {
  if (!data) return '';
  switch (data.typeMessage) {
    case 'textMessage':
      return data.textMessageData?.textMessage ?? '';
    case 'extendedTextMessage':
    case 'quotedMessage':
      return data.extendedTextMessageData?.text ?? '';
    default:
      return `[${data.typeMessage}: этот тип сообщений не поддерживается]`;
  }
}

/** "-1002207127191" (group/channel) or "120363...@g.us" */
export function isGroupChat(chatId: string): boolean {
  return chatId.startsWith('-') || chatId.endsWith('@g.us');
}

const STATUSES: MessageStatus[] = ['sent', 'delivered', 'read', 'failed'];

/**
 * Converts a GREEN-API notification into a reducer action.
 * Returns null for notifications the UI does not need (state changes, etc.).
 */
export function notificationToAction(body: NotificationBody): ChatAction | null {
  switch (body.typeWebhook) {
    case 'incomingMessageReceived':
    case 'outgoingMessageReceived':
    case 'outgoingAPIMessageReceived': {
      const { senderData, idMessage } = body;
      if (!senderData?.chatId || !idMessage) return null;
      // Groups and channels have negative ids: the UI is for personal chats only
      if (isGroupChat(senderData.chatId)) return null;
      const incoming = body.typeWebhook === 'incomingMessageReceived';
      return {
        type: 'message/add',
        message: {
          id: idMessage,
          chatId: senderData.chatId,
          text: extractText(body.messageData),
          direction: incoming ? 'incoming' : 'outgoing',
          timestamp: body.timestamp,
          status: incoming ? undefined : 'sent',
        },
        senderName: incoming
          ? senderData.senderContactName || senderData.senderName || senderData.chatName
          : senderData.chatName,
        senderPhone:
          incoming && senderData.senderPhoneNumber
            ? String(senderData.senderPhoneNumber)
            : undefined,
      };
    }

    case 'outgoingMessageStatus': {
      // noAccount: the recipient has no account or hides the number (Telegram)
      const status = (body.status === 'noAccount' ? 'failed' : body.status) as MessageStatus;
      if (!body.idMessage || !body.chatId || !STATUSES.includes(status)) return null;
      return { type: 'message/status', chatId: body.chatId, id: body.idMessage, status };
    }

    default:
      return null;
  }
}
