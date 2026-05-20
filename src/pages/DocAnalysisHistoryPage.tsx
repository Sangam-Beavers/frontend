import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { DocAnalysisEntry } from '@/types/history';
import styles from './DocAnalysisHistoryPage.module.css';

const ENTRIES: DocAnalysisEntry[] = [
  {
    id: 'doc-1',
    title: '근로계약서',
    meta: '주의 필요 · 2026.05.13',
    status: 'warning',
  },
  {
    id: 'doc-locked',
    title: '잠긴 내역',
    meta: '구독 후 확인 가능',
    status: 'locked',
  },
];

export default function DocAnalysisHistoryPage() {
  const navigate = useNavigate();

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={1} />}>
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
    </MobileScreen>
  );
}
