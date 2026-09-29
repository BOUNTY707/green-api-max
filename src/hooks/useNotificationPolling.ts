import { useEffect, useRef, useState } from 'react';
import type { GreenApiClient } from '../api/greenApi';
import type { NotificationBody } from '../types';

export type PollingStatus = 'connecting' | 'online' | 'error';

const RECEIVE_TIMEOUT_SEC = 5;
const RETRY_DELAY_MS = 3000;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      resolve();
    });
  });

/**
 * Long-polls GREEN-API HTTP API:
 * receiveNotification -> handle -> deleteNotification -> repeat.
 * Exactly one request is in flight at a time, as recommended by the docs.
 */
export function useNotificationPolling(
  client: GreenApiClient,
  onNotification: (body: NotificationBody) => void,
): PollingStatus {
  const [status, setStatus] = useState<PollingStatus>('connecting');
  const handlerRef = useRef(onNotification);

  useEffect(() => {
    handlerRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    async function loop() {
      while (!signal.aborted) {
        try {
          const notification = await client.receiveNotification(RECEIVE_TIMEOUT_SEC, signal);
          setStatus('online');
          if (!notification) continue;

          try {
            handlerRef.current(notification.body);
          } catch (error) {
            console.error('Failed to handle notification', error);
          }
          await client.deleteNotification(notification.receiptId, signal);
        } catch (error) {
          if (signal.aborted) return;
          console.warn('Polling error', error);
          setStatus('error');
          await sleep(RETRY_DELAY_MS, signal);
        }
      }
    }

    void loop();
    return () => controller.abort();
  }, [client]);

  return status;
}
