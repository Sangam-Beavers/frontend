import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useDocuments } from '@/hooks/useDocuments';
import { docDateLabel, docStatusLabel, docTypeLabel } from '@/utils/docAnalysisDisplay';
import styles from './DocAnalysisHistoryPage.module.css';

const FREE_VISIBLE_COUNT = 3;

export default function DocAnalysisHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    data: documents,
    isPending,
    error,
  } = useDocuments(0, FREE_VISIBLE_COUNT, ['ANALYZING', 'COMPLETED']);
  const entries = documents?.content ?? [];

  return (
    <>
      <TopBar
        title={t('mypage2.docHistory.title')}
        onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE))}
      />

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('mypage2.docHistory.cardTitle')}</div>
        <div className={styles.cardText}>{t('mypage2.docHistory.cardText')}</div>
      </div>

      <div className={styles.list}>
        {isPending && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('mypage2.docHistory.loading')}</div>
            </div>
          </div>
        )}
        {error && (
          <div className={styles.item} role="alert">
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('mypage2.docHistory.loadError')}</div>
            </div>
          </div>
        )}
        {!isPending && !error && entries.length === 0 && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('mypage2.docHistory.empty')}</div>
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
              {completed && <span className={styles.pill}>{t('mypage2.docHistory.view')}</span>}
            </button>
          );
        })}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/doc-analysis')}>
        {t('mypage2.docHistory.subscribe')}
      </button>
    </>
  );
}
