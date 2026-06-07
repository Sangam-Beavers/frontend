import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferCompletePage.module.css';

interface CompleteState {
  recipientName: string;
  currency: string;
  amount: string;
}

const FALLBACK: CompleteState = {
  recipientName: 'Linh',
  currency: 'VND',
  amount: '₫1,200,000',
};

const STAMPS = [true, true, true, false, false];

export default function TransferCompletePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const state = (location.state as CompleteState) ?? FALLBACK;

  return (
    <>
      <TopBar title={t('transfer.complete.title')} showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('transfer.complete.cardTitle')}</div>
        <div className={styles.cardText}>
          <span className={styles.highlight}>{state.recipientName}</span>
          {t('transfer.complete.recipientSuffix')} {state.currency} {state.amount}
          <br />
          {t('transfer.complete.feeProcessed')}
        </div>
      </div>

      <div className={styles.couponCard}>
        <div className={styles.couponTitle}>{t('transfer.complete.couponTitle')}</div>
        <div className={styles.couponDesc}>{t('transfer.complete.couponDesc')}</div>
        <div className={styles.stampRow}>
          {STAMPS.map((filled, i) => (
            <div key={i} className={`${styles.stamp} ${filled ? styles.stampFilled : ''}`}>
              {filled ? '✓' : ''}
            </div>
          ))}
        </div>
        <div className={styles.couponNote}>{t('transfer.complete.couponNote')}</div>
      </div>

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate('/')}>
          {t('transfer.complete.goHome')}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => navigate('/mypage/wallet-history')}
        >
          {t('transfer.complete.viewHistory')}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() =>
            navigate('/transfer/receipt', {
              state: {
                recipient: state.recipientName,
                currency: state.currency,
                amount: state.amount,
              },
            })
          }
        >
          {t('transfer.complete.viewReceipt')}
        </button>
      </div>
    </>
  );
}
