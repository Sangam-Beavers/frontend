import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferReceiptPage.module.css';

interface ReceiptState {
  txId?: string;
  dateTime?: string;
  sender?: string;
  recipient?: string;
  method?: string;
  currency?: string;
  amount?: string;
  fee?: string;
  processingTime?: string;
}

export default function TransferReceiptPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();

  const FALLBACK: Required<ReceiptState> = {
    txId: 'GB-20260521-00082',
    dateTime: '2026.05.21 11:24',
    sender: t('transfer.receipt.fallbackSender', { defaultValue: '김소영' }),
    recipient: 'Linh',
    method: t('transfer.receipt.fallbackMethod', { defaultValue: '앱 내 이체' }),
    currency: 'VND',
    amount: '₫1,200,000',
    fee: t('transfer.receipt.fallbackFee', { defaultValue: '없음' }),
    processingTime: '82ms',
  };

  const data: Required<ReceiptState> = { ...FALLBACK, ...(location.state as ReceiptState) };

  const rows: [string, string, boolean?][] = [
    [t('transfer.receipt.txId'), data.txId],
    [t('transfer.receipt.dateTime'), data.dateTime],
    [t('transfer.receipt.sender'), data.sender],
    [t('transfer.receipt.recipient'), data.recipient],
    [t('transfer.receipt.method'), data.method],
    [t('transfer.receipt.currency'), data.currency],
    [t('transfer.receipt.amount'), data.amount],
    [t('transfer.receipt.fee'), data.fee],
    [t('transfer.receipt.processingTime'), data.processingTime],
    [t('transfer.receipt.status'), t('transfer.receipt.statusDone'), true],
  ];

  return (
    <>
      <TopBar
        title={t('transfer.receipt.title')}
        onBack={() => navigate(-1)}
        rightAction={
          <button className={styles.iconBtn} aria-label={t('transfer.receipt.more')}>
            ⋯
          </button>
        }
      />

      <div className={styles.receipt}>
        <div className={styles.receiptHead}>
          <div className={styles.stamp}>✓</div>
          <div className={styles.receiptTitle}>{t('transfer.receipt.receiptTitle')}</div>
          <div className={styles.receiptSub}>{t('transfer.receipt.receiptSub')}</div>
        </div>

        {rows.map(([label, value, isBlue]) => (
          <div key={label} className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>
            <b className={isBlue ? styles.rowValueBlue : styles.rowValue}>{value}</b>
          </div>
        ))}
      </div>

      <div className={styles.qrCard}>
        <div className={styles.qr} aria-label={t('transfer.receipt.qrAria')} />
        <div className={styles.qrInfo}>
          <div className={styles.qrTitle}>{t('transfer.receipt.qrTitle')}</div>
          <div className={styles.qrDesc}>{t('transfer.receipt.qrDesc')}</div>
        </div>
      </div>

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn}>
          {t('transfer.receipt.saveImage')}
        </button>
        <button type="button" className={styles.secondaryBtn}>
          {t('transfer.receipt.savePdf')}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate('/')}>
          {t('transfer.receipt.goHome')}
        </button>
      </div>
    </>
  );
}
