import type { ChatMessage as ChatMessageModel } from '@/stores/chatStore';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: ChatMessageModel;
}

/**
 * 단일 채팅 메시지 풍선. 봇 메시지가 스트리밍 중이고 아직 텍스트가 없으면
 * 타이핑 인디케이터를 보여준다.
 */
export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isTyping = message.streaming && message.text.length === 0;

  return (
    <div className={`${styles.row} ${isUser ? styles.rowUser : styles.rowAssistant}`}>
      <div className={`${styles.bubble} ${isUser ? styles.user : styles.assistant}`}>
        {isTyping ? (
          <span className={styles.typing} aria-label="응답 생성 중">
            <span />
            <span />
            <span />
          </span>
        ) : (
          message.text
        )}
      </div>
    </div>
  );
}
