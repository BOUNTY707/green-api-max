import { useEffect, useState } from 'react';
import type { GreenApiClient } from '../api/greenApi';
import { REQUIRED_SETTINGS, isReceivingConfigured } from '../utils/settings';

type BannerState = 'hidden' | 'misconfigured' | 'saving' | 'saved' | 'error';

/**
 * GREEN-API only queues incoming notifications when `incomingWebhook` is "yes"
 * and `webhookUrl` is empty. New instances often have it switched off,
 * so we check it on start and offer a one-click fix.
 */
export function SettingsBanner({ client }: { client: GreenApiClient }) {
  const [state, setState] = useState<BannerState>('hidden');

  useEffect(() => {
    const controller = new AbortController();
    client
      .getSettings(controller.signal)
      .then((settings) => setState(isReceivingConfigured(settings) ? 'hidden' : 'misconfigured'))
      .catch(() => {
        /* not critical: the chat keeps working, only the hint is not shown */
      });
    return () => controller.abort();
  }, [client]);

  async function fix() {
    setState('saving');
    try {
      await client.setSettings(REQUIRED_SETTINGS);
      setState('saved');
    } catch {
      setState('error');
    }
  }

  if (state === 'hidden') return null;

  if (state === 'saved') {
    return (
      <div className="banner banner--success" role="status">
        Настройки сохранены. Инстанс перезапускается — сообщения и статусы начнут приходить в
        течение ~5 минут.
        <button className="banner__close" onClick={() => setState('hidden')} aria-label="Скрыть">
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="banner banner--warning" role="alert">
      <p>
        В настройках инстанса выключен приём входящих сообщений или статусов доставки
        {state === 'error' && ' (не удалось сохранить, попробуйте ещё раз)'}.
      </p>
      <button
        className="button button--primary button--small"
        onClick={fix}
        disabled={state === 'saving'}
      >
        {state === 'saving' ? 'Сохраняем…' : 'Включить'}
      </button>
    </div>
  );
}
