import { useTranslation } from 'react-i18next';
import styles from './ToolHintCards.module.css';

/**
 * 챗봇 시트 초기 화면(대화 시작 전) — 도구 4종 안내.
 *
 * 백엔드 챗봇 Lambda가 갖고 있는 도구:
 *  - 법령 (Bedrock Knowledge Bases — KB 직접 호출)
 *  - 환율 (자체 MCP 어댑터)
 *  - 커뮤니티 (자체 MCP 어댑터)
 *  - 웹 검색 (Tavily Remote MCP 직결)
 *
 * 사용자(외국인 근로자)에게 MCP 용어를 그대로 노출하지 않고,
 * "어떤 걸 물어볼 수 있는지" 관점으로 안내한다.
 *
 * 2x2 grid 레이아웃 — 시트 첫 시야에 4가지 도구가 모두 보이도록.
 * 이슈 #153 — 라벨/예시 모두 i18n 키화.
 */

interface ToolHintCardsProps {
  /** 예시를 누르면 입력창에 미리 박아준다. */
  onPick: (example: string) => void;
}

const HINT_KEYS: { icon: string; key: 'hintsLaw' | 'hintsRate' | 'hintsCommunity' | 'hintsWeb' }[] =
  [
    { icon: '📜', key: 'hintsLaw' },
    { icon: '💱', key: 'hintsRate' },
    { icon: '💬', key: 'hintsCommunity' },
    { icon: '🌐', key: 'hintsWeb' },
  ];

export default function ToolHintCards({ onPick }: ToolHintCardsProps) {
  const { t } = useTranslation();
  return (
    <div className={styles.intro}>
      <div className={styles.title}>{t('chat.introTitle')} 🤖</div>
      <div className={styles.subtitle}>{t('chat.introSub')}</div>
      <div className={styles.grid}>
        {HINT_KEYS.map((hint) => {
          const heading = t(`chat.${hint.key}.h`);
          const example = t(`chat.${hint.key}.e`);
          return (
            <button
              key={hint.key}
              type="button"
              className={styles.hint}
              onClick={() => onPick(example)}
            >
              <div className={styles.row}>
                <span className={styles.icon} aria-hidden>
                  {hint.icon}
                </span>
                <span className={styles.heading}>{heading}</span>
              </div>
              <span className={styles.example}>{example}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
