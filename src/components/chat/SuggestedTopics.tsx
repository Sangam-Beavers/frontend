import styles from './SuggestedTopics.module.css';

export interface SuggestedTopic {
  title: string;
  meta?: string;
}

interface SuggestedTopicsProps {
  topics: SuggestedTopic[];
  /** 칩 클릭 시 호출 — 입력창에 컨텍스트 기반 프롬프트를 미리 박는다. */
  onPick: (prompt: string) => void;
}

/**
 * 분석 결과 기반 추천 질문 칩 (시트 초기 화면 상단).
 *
 * <p>각 분석 이슈(예: "임금 분석 / 최저임금보다 낮을 가능성")를 클릭하면
 * 컨텍스트가 박힌 첫 질문이 입력창에 자동 세팅된다.
 */
export default function SuggestedTopics({ topics, onPick }: SuggestedTopicsProps) {
  if (topics.length === 0) return null;

  return (
    <div className={styles.wrap}>
      <hr className={styles.divider} />
      <div className={styles.label}>
        <span className={styles.labelIcon} aria-hidden>
          📌
        </span>
        이 결과에 대해 바로 묻기
      </div>
      <div className={styles.chips}>
        {topics.map((topic) => (
          <button
            key={topic.title}
            type="button"
            className={styles.chip}
            onClick={() =>
              onPick(
                topic.meta
                  ? `${topic.title}에 대해 더 자세히 알려주세요. ${topic.meta} 관련해서.`
                  : `${topic.title}에 대해 더 자세히 알려주세요.`
              )
            }
          >
            <span className={styles.chipIcon} aria-hidden>
              🤖
            </span>
            <span className={styles.chipBody}>
              <span className={styles.chipTitle}>{topic.title} 자세히</span>
              {topic.meta && <span className={styles.chipMeta}>{topic.meta}</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
