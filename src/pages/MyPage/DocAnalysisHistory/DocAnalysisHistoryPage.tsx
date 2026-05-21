import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { DOC_ANALYSIS_ENTRIES_MOCK } from '@/mocks/mypageMock';
import styles from './DocAnalysisHistoryPage.module.css';

const ENTRIES = DOC_ANALYSIS_ENTRIES_MOCK.result;

export default function DocAnalysisHistoryPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="문서 분석 내역" />

      <div className={styles.card}>
        <div className={styles.cardTitle}>무료 사용자는 최근 3개까지</div>
        <div className={styles.cardText}>구독하면 최대 10개까지 볼 수 있습니다.</div>
      </div>

      <div className={styles.list}>
        {ENTRIES.map((entry) => {
          const locked = entry.status === 'locked';
          return (
            <button
              key={entry.id}
              type="button"
              className={`${styles.item} ${locked ? styles.itemLocked : ''}`}
              disabled={locked}
              onClick={() => !locked && navigate('/doc-analysis/result')}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{entry.title}</div>
                <div className={styles.itemMeta}>{entry.meta}</div>
              </div>
              {locked ? (
                <span className={styles.lockIcon} aria-label="잠금">
                  🔒
                </span>
              ) : (
                <span className={styles.pill}>보기</span>
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.primary}
        onClick={() => navigate('/doc-analysis/payment')}
      >
        구독하기
      </button>
    </>
  );
}
