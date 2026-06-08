import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  /** 외부에서 미리 박아둘 텍스트 (AskMoreChip 컨텍스트 / 도구 예시 클릭 시). */
  value: string;
  onChange: (text: string) => void;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

/**
 * 챗봇 입력창. 다중 줄 textarea(자동 높이) + 전송 버튼.
 * Enter = 전송, Shift+Enter = 줄바꿈.
 *
 * 이슈 #153 — placeholder / aria-label 키화.
 */
export default function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  const { t } = useTranslation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [composing, setComposing] = useState(false);

  // 내용 길이에 따라 textarea 높이 자동 조절.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 IME 조합 중에는 Enter로 전송하지 않음(글자 깨짐 방지).
    if (e.key === 'Enter' && !e.shiftKey && !composing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={styles.bar}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder={t('chat.inputPlaceholder')}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        disabled={disabled}
      />
      <button
        type="button"
        className={styles.sendBtn}
        onClick={submit}
        disabled={disabled || value.trim().length === 0}
        aria-label={t('chat.send')}
      >
        ↑
      </button>
    </div>
  );
}
