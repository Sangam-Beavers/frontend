import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/stores/chatStore';
import styles from './ChatbotEntryButton.module.css';

interface ChatbotEntryButtonProps {
  /** 챗봇이 묶일 분석 문서의 publicId. 시트 안에서 API 호출에 사용. */
  documentPublicId: string;
}

/**
 * 분석 결과 화면 인라인 챗봇 진입 버튼.
 *
 * <p>이전 시안에서는 floating(FAB) 형태였지만, 분석 결과를 보고 → 챗봇으로 추가 질문 →
 * 액션(저장/공유) 흐름이 더 자연스럽도록 일반 버튼으로 전환됐다(이슈 #89 UX 반복).
 *
 * <p>이슈 #153 — 모든 텍스트 i18n 키화.
 */
export default function ChatbotEntryButton({ documentPublicId }: ChatbotEntryButtonProps) {
  const open = useChatStore((s) => s.open);
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={styles.btn}
      aria-label={t('chat.entryOpenAria')}
      onClick={() => open(documentPublicId)}
    >
      <span className={styles.icon} aria-hidden>
        🤖
      </span>
      <span className={styles.copy}>
        <span className={styles.headline}>{t('chat.entryHeadline')}</span>
        <span className={styles.sub}>{t('chat.entrySub')}</span>
      </span>
    </button>
  );
}
