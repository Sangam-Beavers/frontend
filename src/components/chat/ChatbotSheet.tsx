import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { openChatStream } from '@/api/chat';
import i18n from '@/i18n';
import { createMessage, useChatStore } from '@/stores/chatStore';
import ChatInput from './ChatInput';
import ChatMessageList from './ChatMessageList';
import SuggestedTopics, { type SuggestedTopic } from './SuggestedTopics';
import ToolHintCards from './ToolHintCards';
import styles from './ChatbotSheet.module.css';

interface ChatbotSheetProps {
  /** 분석 결과 기반 추천 질문 — 시트 초기 화면 상단에 표시. 없으면 도구 4종 안내만 노출. */
  suggestedTopics?: SuggestedTopic[];
}

/**
 * 분석 결과 후속 질문 챗봇 바텀시트.
 *
 * - `useChatStore.isOpen`이 true일 때만 렌더.
 * - 메시지/세션/스트리밍 상태는 모두 store가 보유한다.
 * - 첫 화면(메시지 없음)에서는 추천 질문(있을 때) + 도구 4종 안내(ToolHintCards) 노출.
 * - 사용자가 메시지를 보내면 즉시 user 메시지 추가 + 빈 assistant 메시지 추가 후
 *   SSE 토큰이 도착할 때마다 마지막 assistant 메시지에 누적한다.
 */
export default function ChatbotSheet({ suggestedTopics = [] }: ChatbotSheetProps) {
  const { t } = useTranslation();
  const isOpen = useChatStore((s) => s.isOpen);
  const documentPublicId = useChatStore((s) => s.documentPublicId);
  const initialPrompt = useChatStore((s) => s.initialPrompt);
  const messages = useChatStore((s) => s.messages);
  const sessionId = useChatStore((s) => s.sessionId);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const close = useChatStore((s) => s.close);
  const setInitialPrompt = useChatStore((s) => s.setInitialPrompt);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const appendToLastAssistant = useChatStore((s) => s.appendToLastAssistant);
  const finishStreaming = useChatStore((s) => s.finishStreaming);
  const failStreaming = useChatStore((s) => s.failStreaming);
  const setAbortController = useChatStore((s) => s.setAbortController);

  // 입력창 텍스트는 로컬 상태. store의 initialPrompt가 바뀌면 입력창에 흘려보낸다.
  const [draft, setDraft] = useState('');

  // 시트가 열리거나 initialPrompt가 바뀌면 입력창에 미리 박는다.
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setDraft(initialPrompt);
      // 한 번 사용한 initialPrompt는 비워서, 시트 재오픈 시 잔존 방지.
      setInitialPrompt('');
    }
  }, [isOpen, initialPrompt, setInitialPrompt]);

  const handleSubmit = (text: string) => {
    if (!documentPublicId || isStreaming) return;

    // 1) 사용자 메시지 + 빈 봇 메시지(스트리밍 중) 추가.
    const userMsg = createMessage('user', text);
    const botMsg = createMessage('assistant', '', true);
    appendMessage(userMsg);
    appendMessage(botMsg);
    setDraft('');

    // 2) SSE 호출 시작. abortController는 store가 들고 있다가 close 시 abort.
    // user_lang: 사용자가 마이페이지에서 선택한 현재 i18n 언어를 그대로 챗봇 Lambda에 전달 (#159 통합).
    // base 언어(예: "en-US")가 들어올 수 있으므로 region 서픽스는 잘라서 ko/en/vi/fil 4종으로 정규화.
    // 백엔드 ChatRequest는 @NotBlank만 검증하고, Lambda system_prompt가 미지원 코드 fallback 처리.
    const userLang = (i18n.language || 'ko').split('-')[0];
    const controller = openChatStream(
      documentPublicId,
      {
        message: text,
        session_id: sessionId ?? undefined,
        user_lang: userLang,
      },
      {
        onToken: (chunk) => appendToLastAssistant(chunk),
        onDone: (sid) => finishStreaming(sid),
        onError: (err) => {
          // 401은 client.ts interceptor가 처리하지 않으므로(raw fetch라) 여기서 직접 안내.
          // 실제 redirect는 추후 옵션. 우선 사용자에게 에러 메시지로 보여줌.
          const msg = mapErrorToUserMessage(err.code, err.message);
          failStreaming(msg);
        },
      }
    );
    setAbortController(controller);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.backdrop} onClick={close} />
      <div className={styles.sheet} role="dialog" aria-modal="true" aria-label={t('chat.aria')}>
        <div className={styles.header}>
          <div className={styles.handle} aria-hidden />
          <div className={styles.headerRow}>
            <div className={styles.title}>{t('chat.title')}</div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={close}
              aria-label={t('chat.close')}
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {messages.length === 0 ? (
            <>
              {/* 도구 4종 안내 — 시트 열자마자 "이 챗봇이 뭘 도와줄 수 있는지" 한 눈에 */}
              <ToolHintCards onPick={(example) => setDraft(example)} />
              {/* 분석 결과 기반 추천 질문 — 도구 안내 아래에 부가적으로 */}
              <SuggestedTopics topics={suggestedTopics} onPick={(prompt) => setDraft(prompt)} />
            </>
          ) : (
            <ChatMessageList messages={messages} />
          )}
        </div>

        <ChatInput
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          disabled={isStreaming}
        />
      </div>
    </>
  );
}

/**
 * 백엔드 에러 코드를 사용자에게 보여줄 한글 메시지로 매핑.
 * 코드별 의미는 docs/document-analysis/ai-chatbot-mcp.md 참고.
 */
function mapErrorToUserMessage(code: string, fallback: string): string {
  // 함수 외부 호출(SSE 콜백)이라 i18n 인스턴스를 직접 사용 (이슈 #153).
  switch (code) {
    case 'AUTH4011':
      return i18n.t('chat.errAuth');
    case 'COMMON4031':
      return i18n.t('chat.errForbidden');
    case 'DOCUMENT4001':
      return i18n.t('chat.errDocNotFound');
    case 'COMMON4001':
      return i18n.t('chat.errBadInput');
    default:
      return fallback || i18n.t('chat.errGeneric');
  }
}
