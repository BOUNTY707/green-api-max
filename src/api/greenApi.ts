import type {
  CheckAccountResponse,
  Credentials,
  DeleteNotificationResponse,
  ReceiveNotificationResponse,
  SendMessageResponse,
  StateInstanceResponse,
} from '../types';

export const DEFAULT_API_URL = 'https://api.green-api.com/v3';

export class GreenApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GreenApiError';
    this.status = status;
  }
}

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Некорректный запрос',
  401: 'Неверный idInstance или apiTokenInstance',
  403: 'Доступ запрещён: проверьте idInstance и apiTokenInstance',
  429: 'Слишком много запросов, попробуйте позже',
  466: 'Исчерпан лимит тарифа',
  469: 'Лимит проверки номеров исчерпан, попробуйте позже',
};

/**
 * Minimal GREEN-API client (MAX, v3).
 * URL format: {apiUrl}/waInstance{idInstance}/{method}/{apiTokenInstance}
 */
export class GreenApiClient {
  private readonly credentials: Credentials;

  constructor(credentials: Credentials) {
    this.credentials = {
      ...credentials,
      idInstance: credentials.idInstance.trim(),
      apiTokenInstance: credentials.apiTokenInstance.trim(),
      apiUrl: (credentials.apiUrl.trim() || DEFAULT_API_URL).replace(/\/+$/, ''),
    };
  }

  private url(method: string, suffix = ''): string {
    const { apiUrl, idInstance, apiTokenInstance } = this.credentials;
    return `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}`;
  }

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      throw new GreenApiError('Нет соединения с GREEN-API', 0);
    }

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const message = ERROR_MESSAGES[response.status] ?? (text || `Ошибка ${response.status}`);
      throw new GreenApiError(message, response.status);
    }

    const text = await response.text();
    // receiveNotification returns the literal `null` when the queue is empty
    return (text ? JSON.parse(text) : null) as T;
  }

  private post<T>(method: string, body: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(this.url(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  }

  getStateInstance(signal?: AbortSignal): Promise<StateInstanceResponse> {
    return this.request(this.url('getStateInstance'), { signal });
  }

  checkAccount(phoneNumber: string, signal?: AbortSignal): Promise<CheckAccountResponse> {
    return this.post('checkAccount', { phoneNumber: Number(phoneNumber) }, signal);
  }

  sendMessage(chatId: string, message: string, signal?: AbortSignal): Promise<SendMessageResponse> {
    return this.post('sendMessage', { chatId, message }, signal);
  }

  receiveNotification(
    receiveTimeout = 5,
    signal?: AbortSignal,
  ): Promise<ReceiveNotificationResponse | null> {
    return this.request(this.url('receiveNotification', `?receiveTimeout=${receiveTimeout}`), {
      signal,
    });
  }

  deleteNotification(receiptId: number, signal?: AbortSignal): Promise<DeleteNotificationResponse> {
    return this.request(this.url('deleteNotification', `/${receiptId}`), {
      method: 'DELETE',
      signal,
    });
  }
}
