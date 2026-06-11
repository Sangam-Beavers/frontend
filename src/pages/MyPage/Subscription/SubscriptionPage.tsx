import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import styles from './SubscriptionPage.module.css';

export default function SubscriptionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [cancelled, setCancelled] = useState(false);

  return (
    <>
      <TopBar
        title={t('mypage2.subscription.title')}
        onBack={() => navigate(location.state?.from ?? ROUTES.MYPAGE)}
      />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>
          {t('mypage2.subscription.statusPrefix')}{' '}
          {cancelled
            ? t('mypage2.subscription.statusNone')
            : t('mypage2.subscription.statusPremium')}
        </div>
        <div className={styles.cardText}>
          {cancelled
            ? t('mypage2.subscription.descCancelled')
            : t('mypage2.subscription.descActive')}
        </div>
      </div>

      {cancelled && (
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => navigate('/doc-analysis')}
        >
          {t('mypage2.subscription.subscribe')}
        </button>
      )}

      {!cancelled && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('mypage2.subscription.currentTitle')}</div>
          <div className={styles.row}>
            <span>{t('mypage2.subscription.startDate')}</span>
            <span>2026.05.14</span>
          </div>
          <div className={styles.row}>
            <span>{t('mypage2.subscription.nextDate')}</span>
            <span>2026.06.14</span>
          </div>
          <button type="button" className={styles.dangerBtn} onClick={() => setCancelled(true)}>
            {t('mypage2.subscription.cancel')}
          </button>
        </div>
      )}
    </>
  );
}
