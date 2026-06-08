import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/stores/chatStore';
import styles from './AskMoreChip.module.css';

interface AskMoreChipProps {
  documentPublicId: string;
  /** 분석 카드 제목(예: "임금 분석"). 자동 프롬프트에 컨텍스트로 들어간다. */
  topicTitle: string;
  /** 카드 부가 설명(예: "최저임금보다 낮을 가능성"). 자동 프롬프트에 같이 들어간다. */
  topicMeta?: string;
  className?: string;
}

/**
 * "🤖 더 묻기" 칩 — 분석 이슈 카드별 컨텍스트 진입점.
 * 클릭 시 챗봇 시트를 열며 입력창에 컨텍스트 기반 첫 질문을 자동 세팅한다.
 */
export default function AskMoreChip({
  documentPublicId,
  topicTitle,
  topicMeta,
  className,
}: AskMoreChipProps) {
  const { t } = useTranslation();
  const open = useChatStore((s) => s.open);

  const handleClick = () => {
    const prompt = topicMeta
      ? t('chat.askMorePromptWithMeta', {
          title: topicTitle,
          meta: topicMeta,
          defaultValue: `${topicTitle}에 대해 더 자세히 알려주세요. ${topicMeta} 관련해서.`,
        })
      : t('chat.askMorePrompt', {
          title: topicTitle,
          defaultValue: `${topicTitle}에 대해 더 자세히 알려주세요.`,
        });
    open(documentPublicId, prompt);
  };

  return (
    <button
      type="button"
      className={`${styles.chip}${className ? ` ${className}` : ''}`}
      onClick={handleClick}
      aria-label={t('chat.askMoreAria', {
        title: topicTitle,
        defaultValue: `${topicTitle} AI에게 더 묻기`,
      })}
    >
      <span className={styles.icon} aria-hidden>
        🤖
      </span>
      {t('chat.askMore', { defaultValue: '더 묻기' })}
    </button>
  );
}
