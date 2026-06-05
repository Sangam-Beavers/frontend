import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import type { ChatMessage as ChatMessageModel } from '@/stores/chatStore';
import styles from './ChatMessage.module.css';

interface ChatMessageProps {
  message: ChatMessageModel;
}

/**
 * 마크다운 안의 모든 `<a>`를 새 탭으로 열고 rel="noopener" 보안 속성을 박는다.
 * 출처 링크는 외부 사이트가 대부분이라 앱을 빠져나가지 않게 새 탭 처리.
 */
const MARKDOWN_COMPONENTS: Components = {
  a: ({ children, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
};

/**
 * 단일 채팅 메시지 풍선.
 *
 * <ul>
 *   <li>user 메시지 — 그대로 텍스트 (마크다운 렌더 X, 사용자가 친 그대로)</li>
 *   <li>assistant 메시지 — react-markdown + remark-gfm 으로 렌더 (헤더/표/링크/인용/강조)</li>
 *   <li>스트리밍 중이고 텍스트가 비었으면 타이핑 인디케이터 표시</li>
 * </ul>
 *
 * <p>raw HTML은 react-markdown 기본 정책상 자동 escape — XSS 안전.
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
        ) : isUser ? (
          message.text
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
