// pages/wallet/TransferReceipt/TransferReceiptPage.tsx — 송금 확인증
// develop의 useReceipt + ReceiptBody 구조 + i18n 키화

import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useReceipt } from '@/hooks/useReceipt';
import styles from './TransferReceiptPage.module.css';

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  VND: '₫',
  PHP: '₱',
};
const currencySymbol = (code: string) => CURRENCY_SYMBOL[code] ?? `${code} `;

const STATUS_KEY: Record<string, string> = {
  COMPLETED: 'transfer.receipt.statusCompleted',
  PENDING: 'transfer.receipt.statusPending',
  PROCESSING: 'transfer.receipt.statusProcessing',
  FAILED: 'transfer.receipt.statusFailed',
  CANCELLED: 'transfer.receipt.statusCancelled',
};

function formatAmount(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currencySymbol(currencyCode)}${amount}`;
  const noDecimals = currencyCode === 'KRW' || currencyCode === 'VND';
  return `${currencySymbol(currencyCode)}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })}`;
}

function formatFee(fee: string, currencyCode: string, noneLabel: string): string {
  const n = Number(fee);
  if (Number.isNaN(n) || n === 0) return noneLabel;
  return formatAmount(fee, currencyCode);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export default function TransferReceiptPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { transferPublicId = '' } = useParams<{ transferPublicId: string }>();
  const { data, isLoading, error } = useReceipt(transferPublicId);

  const errorMessage =
    error instanceof ApiException
      ? error.code === 'TRANSFER4001'
        ? t('transfer.receipt.errNotFound')
        : error.message || t('transfer.receipt.errLoadFailed')
      : error
        ? t('transfer.receipt.errLoadFailed')
        : null;

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

      {isLoading ? (
        <div className={styles.receipt}>
          <div className={styles.receiptHead}>
            <div className={styles.receiptTitle}>{t('transfer.receipt.loading')}</div>
          </div>
        </div>
      ) : errorMessage ? (
        <div className={styles.receipt} role="alert">
          <div className={styles.receiptHead}>
            <div className={styles.receiptTitle}>{errorMessage}</div>
          </div>
        </div>
      ) : data ? (
        <ReceiptBody data={data} />
      ) : null}

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn} disabled>
          {t('transfer.receipt.saveImage')}
        </button>
        <button type="button" className={styles.secondaryBtn} disabled>
          {t('transfer.receipt.savePdf')}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate('/')}>
          {t('transfer.receipt.goHome')}
        </button>
      </div>
    </>
  );
}

function ReceiptBody({ data }: { data: NonNullable<ReturnType<typeof useReceipt>['data']> }) {
  const { t } = useTranslation();
  const isRemittance = Boolean(data.bank_name);
  const method = isRemittance
    ? t('transfer.receipt.methodRemittance')
    : t('transfer.receipt.methodInternal');
  const statusLabel = STATUS_KEY[data.status] ? t(STATUS_KEY[data.status]) : data.status;
  const isCompleted = data.status === 'COMPLETED';

  type Row = [string, string, boolean?];
  const rows: Row[] = [
    [t('transfer.receipt.txNumber'), data.public_id],
    [t('transfer.receipt.dateTime'), formatDateTime(data.created_at)],
    [t('transfer.receipt.senderRow'), data.sender_name ?? '-'],
    [t('transfer.receipt.recipientRow'), data.receiver_name ?? '-'],
    [t('transfer.receipt.methodRow'), method],
    ...(isRemittance
      ? ([
          [t('transfer.receipt.bankRow'), data.bank_name ?? '-'],
          [t('transfer.receipt.accountRow'), data.account_number ?? '-'],
        ] as Row[])
      : []),
    [t('transfer.receipt.currencyRow'), data.currency_code],
    [t('transfer.receipt.amountRow'), formatAmount(data.amount, data.currency_code)],
    [
      t('transfer.receipt.feeRow'),
      formatFee(data.fee, data.currency_code, t('transfer.receipt.feeNone')),
    ],
    ...(data.exchange_rate
      ? ([
          [t('transfer.receipt.exchangeRateRow'), data.exchange_rate],
          [
            t('transfer.receipt.receiveAmountRow'),
            formatAmount(data.receive_amount, data.receive_currency_code),
          ],
          [t('transfer.receipt.receiveCurrencyRow'), data.receive_currency_code],
        ] as Row[])
      : []),
    [t('transfer.receipt.statusRow'), statusLabel, isCompleted],
  ];

  return (
    <>
      <div className={styles.receipt}>
        <div className={styles.receiptHead}>
          <div className={styles.stamp}>{isCompleted ? '✓' : '!'}</div>
          <div className={styles.receiptTitle}>
            {isCompleted
              ? t('transfer.receipt.titleCompleted')
              : t('transfer.receipt.titleOther', { status: statusLabel })}
          </div>
          <div className={styles.receiptSub}>{t('transfer.receipt.subtitle')}</div>
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
    </>
  );
}
