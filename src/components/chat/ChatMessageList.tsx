import { useEffect, useRef } from 'react';
import type { ChatMessage as ChatMessageModel } from '@/stores/chatStore';
import ChatMessage from './ChatMessage';
import styles from './ChatMessageList.module.css';

interface ChatMessageListProps {
  messages: ChatMessageModel[];
}

/**
 * 메시지 리스트. 새 메시지/토큰이 도착할 때마다 맨 아래로 자동 스크롤.
 * 마지막 봇 메시지의 text 길이를 의존성으로 넣어 스트리밍 중에도 따라가게 한다.
 */
export default function ChatMessageList({ messages }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // 메시지 수 + 마지막 메시지의 길이 변화에 따라 스크롤.
  const last = messages[messages.length - 1];
  const lastLen = last?.text.length ?? 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastLen]);

  return (
    <div className={styles.list}>
      {messages.map((m) => (
        <ChatMessage key={m.id} message={m} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
