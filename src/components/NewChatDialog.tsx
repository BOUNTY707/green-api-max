import { useEffect, useRef, useState, type FormEvent } from 'react';
import { GreenApiError, type GreenApiClient } from '../api/greenApi';
import type { Chat } from '../types';
import { formatPhone, isValidPhone, normalizePhone } from '../utils/phone';
import { CloseIcon } from './icons';

interface NewChatDialogProps {
  client: GreenApiClient;
  onCreate: (chat: Omit<Chat, 'unread'>) => void;
  onClose: () => void;
}

export function NewChatDialog({ client, onCreate, onClose }: NewChatDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phone = normalizePhone(phoneInput);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!isValidPhone(phone)) {
      setError('Введите номер в международном формате, например 79991234567');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // MAX addresses users by chatId, so resolve it by phone number first
      const account = await client.checkAccount(phone);
      if (!account.exist) {
        setError('Этот номер не зарегистрирован в мессенджере');
        return;
      }
      onCreate({ id: account.chatId, name: formatPhone(phone), phone });
    } catch (err) {
      // checkAccount may be unavailable (limits, non-RU number): fall back to the phone chatId
      if (
        err instanceof GreenApiError &&
        err.status !== 0 &&
        err.status !== 401 &&
        err.status !== 403
      ) {
        onCreate({ id: `${phone}@c.us`, name: formatPhone(phone), phone });
      } else {
        setError(err instanceof GreenApiError ? err.message : 'Неизвестная ошибка');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === dialogRef.current && onClose()}
    >
      <form className="dialog__body" onSubmit={handleSubmit} noValidate>
        <header className="dialog__header">
          <h2>Новый чат</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Закрыть">
            <CloseIcon />
          </button>
        </header>

        <label className="field">
          <span className="field__label">Номер телефона получателя</span>
          <input
            className="field__input"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            type="tel"
            inputMode="tel"
            placeholder="+7 999 123-45-67"
            autoFocus
          />
        </label>

        {error && (
          <p className="dialog__error" role="alert">
            {error}
          </p>
        )}

        <button
          className="button button--primary button--block"
          type="submit"
          disabled={loading || phone.length === 0}
        >
          {loading ? 'Ищем…' : 'Создать чат'}
        </button>
      </form>
    </dialog>
  );
}
