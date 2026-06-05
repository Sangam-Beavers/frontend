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
 */

interface ToolHintCardsProps {
  /** 예시를 누르면 입력창에 미리 박아준다. */
  onPick: (example: string) => void;
}

const HINTS: { icon: string; heading: string; example: string }[] = [
  { icon: '📜', heading: '법령', example: '최저임금이 얼마예요?' },
  { icon: '💱', heading: '환율', example: '100만원이 베트남 동으로 얼마예요?' },
  { icon: '💬', heading: '커뮤니티', example: '다른 분들은 어떻게 해결했어요?' },
  { icon: '🌐', heading: '웹 검색', example: '최근 노동법 개정 내용 알려주세요' },
];

export default function ToolHintCards({ onPick }: ToolHintCardsProps) {
  return (
    <div className={styles.intro}>
      <div className={styles.title}>무엇이든 물어보세요 🤖</div>
      <div className={styles.subtitle}>이런 걸 도와드릴 수 있어요</div>
      <div className={styles.grid}>
        {HINTS.map((hint) => (
          <button
            key={hint.heading}
            type="button"
            className={styles.hint}
            onClick={() => onPick(hint.example)}
          >
            <div className={styles.row}>
              <span className={styles.icon} aria-hidden>
                {hint.icon}
              </span>
              <span className={styles.heading}>{hint.heading}</span>
            </div>
            <span className={styles.example}>{hint.example}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
