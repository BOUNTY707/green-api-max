import { useState, type FormEvent } from 'react';
import { DEFAULT_API_URL, GreenApiClient, GreenApiError } from '../api/greenApi';
import type { Credentials } from '../types';
import { AppLogo } from './icons';

interface LoginPageProps {
  onLogin: (credentials: Credentials) => void;
}

const STATE_LABELS: Record<string, string> = {
  notAuthorized: 'инстанс не авторизован — отсканируйте QR-код в личном кабинете GREEN-API',
  blocked: 'инстанс заблокирован',
  starting: 'инстанс запускается, повторите через пару минут',
  yellowCard: 'на инстансе ограничена отправка сообщений',
};

export function LoginPage({ onLogin }: LoginPageProps) {
  const [idInstance, setIdInstance] = useState('');
  const [apiTokenInstance, setApiTokenInstance] = useState('');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = idInstance.trim() !== '' && apiTokenInstance.trim() !== '' && !loading;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    const credentials: Credentials = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: apiUrl.trim().replace(/\/+$/, '') || DEFAULT_API_URL,
    };

    setLoading(true);
    setError(null);
    try {
      const { stateInstance } = await new GreenApiClient(credentials).getStateInstance();
      if (stateInstance !== 'authorized') {
        setError(`Не удалось войти: ${STATE_LABELS[stateInstance] ?? stateInstance}`);
        return;
      }
      onLogin(credentials);
    } catch (err) {
      setError(err instanceof GreenApiError ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <AppLogo width={56} height={56} />
        <h1 className="login__title">Вход в чат</h1>
        <p className="login__subtitle">
          Введите данные инстанса GREEN-API для мессенджера MAX. Их можно найти в{' '}
          <a href="https://console.green-api.com" target="_blank" rel="noreferrer">
            личном кабинете
          </a>
          .
        </p>

        <label className="field">
          <span className="field__label">idInstance</span>
          <input
            className="field__input"
            value={idInstance}
            onChange={(e) => setIdInstance(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="Например, 3100000001"
            autoComplete="username"
            autoFocus
          />
        </label>

        <label className="field">
          <span className="field__label">apiTokenInstance</span>
          <input
            className="field__input"
            value={apiTokenInstance}
            onChange={(e) => setApiTokenInstance(e.target.value)}
            type="password"
            placeholder="Ваш apiTokenInstance"
            autoComplete="current-password"
          />
        </label>

        <details className="login__advanced">
          <summary>Дополнительно</summary>
          <label className="field">
            <span className="field__label">apiUrl</span>
            <input
              className="field__input"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder={DEFAULT_API_URL}
            />
          </label>
        </details>

        {error && (
          <p className="login__error" role="alert">
            {error}
          </p>
        )}

        <button
          className="button button--primary button--block"
          type="submit"
          disabled={!canSubmit}
        >
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  );
}
