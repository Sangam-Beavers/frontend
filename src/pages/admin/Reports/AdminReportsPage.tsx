import { useNavigate } from 'react-router-dom';
import { adminReportApi, type ReportedAuthorSummary } from '@/api/admin';
import { useQuery } from '@tanstack/react-query';
import { buildAdminMemberDetailPath } from '@/constants/routes';
import styles from './AdminReportsPage.module.css';

export default function AdminReportsPage() {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin', 'reports'],
    queryFn: () => adminReportApi.getReportedAuthors({ size: 50 }),
    retry: false,
  });

  const authors: ReportedAuthorSummary[] = data?.authors ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>신고 관리</span>
        <div style={{ width: 40 }} />
      </div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : isError ? (
        <div className={styles.empty} style={{ color: '#e53e3e' }}>
          community-service에 연결할 수 없습니다.
        </div>
      ) : authors.length === 0 ? (
        <div className={styles.empty}>신고된 회원이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {authors.map((a) => (
            <div
              key={a.author_public_id}
              className={styles.card}
              onClick={() => navigate(buildAdminMemberDetailPath(a.author_public_id))}
            >
              <div className={styles.nameRow}>
                <span className={styles.name}>{a.name ?? '(이름 없음)'}</span>
                {a.nickname && <span className={styles.nickname}>@{a.nickname}</span>}
                <span className={styles.reportBadge}>신고 {a.total_report_count}회</span>
              </div>
              <div className={styles.uid}>{a.author_public_id}</div>
              <div className={styles.statsRow}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{a.total_report_count}</span>
                  <span className={styles.statLabel}>총 신고수</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{a.reported_content_count}</span>
                  <span className={styles.statLabel}>신고된 콘텐츠</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
