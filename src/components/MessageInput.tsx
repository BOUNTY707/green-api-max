import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { SendIcon } from './icons';

const MAX_LENGTH = 4000; // GREEN-API sendMessage limit

interface MessageInputProps {
  onSend: (text: string) => void;
}

export function MessageInput({ onSend }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const trimmed = text.trim();

  // Auto-grow textarea up to the CSS max-height
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (!trimmed) return;
    onSend(trimmed);
    setText('');
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form className="composer" onSubmit={submit}>
      <textarea
        ref={textareaRef}
        className="composer__input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Сообщение"
        rows={1}
        maxLength={MAX_LENGTH}
        aria-label="Текст сообщения"
        autoFocus
      />
      <button
        className="composer__send"
        type="submit"
        disabled={!trimmed}
        aria-label="Отправить"
        title="Отправить (Enter)"
      >
        <SendIcon width={20} height={20} />
      </button>
    </form>
  );
}
