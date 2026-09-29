export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  text: string;
  direction: MessageDirection;
  /** Unix timestamp, seconds */
  timestamp: number;
  status?: MessageStatus;
}

export interface Chat {
  /** MAX chatId, e.g. "10000000" or "79991234567@c.us" */
  id: string;
  name: string;
  phone?: string;
  unread: number;
}

/* ---------- GREEN-API responses ---------- */

export interface StateInstanceResponse {
  stateInstance: 'notAuthorized' | 'authorized' | 'blocked' | 'starting' | 'yellowCard' | string;
}

type YesNo = 'yes' | 'no';

export interface InstanceSettings {
  webhookUrl: string;
  incomingWebhook: YesNo;
  outgoingWebhook: YesNo;
  outgoingMessageWebhook: YesNo;
  outgoingAPIMessageWebhook: YesNo;
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface CheckAccountResponse {
  exist: boolean;
  chatId: string;
  fromCache?: boolean;
}

export interface DeleteNotificationResponse {
  result: boolean;
  reason?: string;
}

export interface SenderData {
  chatId: string;
  chatName?: string;
  chatType?: string;
  sender?: string;
  senderName?: string;
  senderContactName?: string;
  senderPhoneNumber?: number;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: { textMessage: string };
  extendedTextMessageData?: { text: string };
}

export interface NotificationBody {
  typeWebhook: string;
  timestamp: number;
  idMessage?: string;
  senderData?: SenderData;
  messageData?: MessageData;
  /** outgoingMessageStatus fields */
  chatId?: string;
  status?: string;
}

export interface ReceiveNotificationResponse {
  receiptId: number;
  body: NotificationBody;
}
