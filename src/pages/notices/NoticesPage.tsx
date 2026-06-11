import { useNavigate } from 'react-router-dom';
import { noticesApi, type NoticeItem } from '@/api/app';
import { useQuery } from '@tanstack/react-query';
import { buildNoticeDetailPath } from '@/constants/routes';
import styles from './NoticesPage.module.css';

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

export default function NoticesPage() {
  const navigate = useNavigate();

  const { data: notices = [], isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: () => noticesApi.listPublished(),
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
      ) : notices.length === 0 ? (
        <div className={styles.empty}>등록된 공지사항이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {notices.map((n: NoticeItem) => (
            <div
              key={n.public_id}
              className={styles.item}
              onClick={() => navigate(buildNoticeDetailPath(n.public_id))}
            >
              <div className={styles.itemHeader}>
                {n.pinned && <span className={styles.pinBadge}>📌 공지</span>}
                <span className={styles.date}>{formatDate(n.created_at)}</span>
              </div>
              <div className={styles.itemTitle}>{n.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
