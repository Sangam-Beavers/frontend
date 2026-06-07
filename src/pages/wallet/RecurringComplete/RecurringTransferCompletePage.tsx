import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './RecurringTransferCompletePage.module.css';

export default function RecurringTransferCompletePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <>
      <TopBar title={t('recurring.complete.title')} showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('recurring.complete.cardTitle')}</div>
        <div className={styles.cardText}>
          {t('recurring.complete.summaryRecipient', { name: 'Linh', amount: 'VND ₫1,200,000' })}
          <br />
          {t('recurring.complete.summarySchedule', {
            schedule: t('recurring.complete.fallbackSchedule', { defaultValue: '매월 25일' }),
          })}
        </div>
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring')}>
        {t('recurring.complete.viewList')}
      </button>
      <button type="button" className={styles.ghost} onClick={() => navigate('/')}>
        {t('recurring.complete.backHome')}
      </button>
    </>
  );
}
