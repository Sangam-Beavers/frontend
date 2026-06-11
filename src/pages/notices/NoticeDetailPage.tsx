import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { noticesApi } from '@/api/app';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import styles from './NoticeDetailPage.module.css';

function formatDate(iso: string) {
  return iso ? iso.replace('T', ' ').slice(0, 16) : '';
}

export default function NoticeDetailPage() {
  const { t } = useTranslation();
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
      <TopBar title={t('notices.title')} onBack={() => navigate(ROUTES.NOTICES)} />

      {isLoading ? (
        <div className={styles.empty}>{t('notices.loading')}</div>
      ) : isError || !notice ? (
        <div className={styles.empty}>{t('notices.loadError')}</div>
      ) : (
        <div className={styles.article}>
          {notice.pinned && <span className={styles.pinBadge}>{t('notices.pinned')}</span>}
          <h1 className={styles.articleTitle}>{notice.title}</h1>
          <div className={styles.meta}>{formatDate(notice.created_at)}</div>
          <hr className={styles.divider} />
          <div className={styles.body}>{notice.content}</div>
        </div>
      )}
    </div>
  );
}
