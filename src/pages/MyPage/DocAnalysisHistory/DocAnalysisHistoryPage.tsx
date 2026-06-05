import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useDocuments } from '@/hooks/useDocuments';
import { docDateLabel, docStatusLabel, docTypeLabel } from '@/utils/docAnalysisDisplay';
import styles from './DocAnalysisHistoryPage.module.css';

// 무료 사용자 노출 제한 — 안내 카드 문구("최근 3개까지")와 동일한 값.
const FREE_VISIBLE_COUNT = 3;

export default function DocAnalysisHistoryPage() {
  const navigate = useNavigate();
  // document_submissions + document_results join 목록 (최근순).
  // 실패(FAILED) 내역은 서버 status 필터(api-spec §4)로 숨기고 최근 3건만 노출.
  const {
    data: documents,
    isPending,
    error,
  } = useDocuments(0, FREE_VISIBLE_COUNT, ['ANALYZING', 'COMPLETED']);
  const entries = documents?.content ?? [];

  return (
    <>
      <TopBar title="문서 분석 내역" />

      <div className={styles.card}>
        <div className={styles.cardTitle}>무료 사용자는 최근 3개까지</div>
        <div className={styles.cardText}>구독하면 최대 10개까지 볼 수 있습니다.</div>
      </div>

      <div className={styles.list}>
        {isPending && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>내역을 불러오는 중…</div>
            </div>
          </div>
        )}
        {error && (
          <div className={styles.item} role="alert">
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>
                내역을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
              </div>
            </div>
          </div>
        )}
        {!isPending && !error && entries.length === 0 && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>아직 분석한 문서가 없어요.</div>
            </div>
          </div>
        )}
        {entries.map((entry) => {
          const completed = entry.status === 'COMPLETED';
          return (
            <button
              key={entry.public_id}
              type="button"
              className={styles.item}
              disabled={!completed}
              onClick={() =>
                completed &&
                navigate('/doc-analysis/result', {
                  state: { documentPublicId: entry.public_id },
                })
              }
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{docTypeLabel(entry)}</div>
                <div className={styles.itemMeta}>
                  {entry.file_name} · {docStatusLabel(entry)} · {docDateLabel(entry.created_at)}
                </div>
              </div>
              {completed && <span className={styles.pill}>보기</span>}
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
