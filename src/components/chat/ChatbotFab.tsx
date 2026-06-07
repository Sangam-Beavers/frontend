import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/stores/chatStore';
import styles from './ChatbotFab.module.css';

interface ChatbotFabProps {
  /** 챗봇이 묶일 분석 문서의 publicId. 시트 안에서 API 호출에 사용. */
  documentPublicId: string;
}

/**
 * 분석 결과 화면 우하단 플로팅 진입 버튼.
 * 누르면 챗봇 바텀시트를 연다(초기 프롬프트 없음 — 사용자가 자유롭게 입력).
 */
export default function ChatbotFab({ documentPublicId }: ChatbotFabProps) {
  const { t } = useTranslation();
  const open = useChatStore((s) => s.open);

  return (
    <button
      type="button"
      className={styles.fab}
      aria-label={t('chat.entryOpenAria')}
      onClick={() => open(documentPublicId)}
    >
      <span className={styles.icon} aria-hidden>
        🤖
      </span>
      {t('chat.fabLabel', { defaultValue: '모르겠으면 물어봐요' })}
    </button>
  );
}
