import { useNavigate, useParams } from 'react-router-dom';
import { noticesApi } from '@/api/app';
import { useQuery } from '@tanstack/react-query';
import styles from './NoticeDetailPage.module.css';

function formatDate(iso: string) {
  return iso ? iso.replace('T', ' ').slice(0, 16) : '';
}

export default function NoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId } = useParams<{ noticeId: string }>();

  const {
    data: notice,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notice', noticeId],
    queryFn: () => noticesApi.getOne(noticeId!),
    enabled: !!noticeId,
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.backBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>공지사항</span>
        <div style={{ width: 40 }} />
      </div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : isError || !notice ? (
        <div className={styles.empty}>공지사항을 불러올 수 없습니다.</div>
      ) : (
        <div className={styles.article}>
          {notice.pinned && <span className={styles.pinBadge}>📌 공지</span>}
          <h1 className={styles.articleTitle}>{notice.title}</h1>
          <div className={styles.meta}>{formatDate(notice.created_at)}</div>
          <hr className={styles.divider} />
          <div className={styles.body}>{notice.content}</div>
        </div>
      )}
    </div>
  );
}
