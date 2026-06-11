import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { noticesApi, type NoticeItem } from '@/api/app';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { buildNoticeDetailPath, ROUTES } from '@/constants/routes';
import styles from './NoticesPage.module.css';

function formatDate(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

export default function NoticesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    data: notices = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['notices'],
    queryFn: () => noticesApi.listPublished(),
  });

  return (
    <div className={styles.wrap}>
      <TopBar
        title={t('notices.title')}
        onBack={() => navigate(location.state?.from ?? ROUTES.HOME)}
      />

      {isLoading ? (
        <div className={styles.empty}>{t('notices.loading')}</div>
      ) : isError ? (
        <div className={styles.empty} role="alert">
          {t('notices.loadError')}
        </div>
      ) : notices.length === 0 ? (
        <div className={styles.empty}>{t('notices.empty')}</div>
      ) : (
        <div className={styles.list}>
          {notices.map((n: NoticeItem) => (
            <div
              key={n.public_id}
              className={styles.item}
              onClick={() => navigate(buildNoticeDetailPath(n.public_id))}
            >
              <div className={styles.itemHeader}>
                {n.pinned && <span className={styles.pinBadge}>{t('notices.pinned')}</span>}
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
