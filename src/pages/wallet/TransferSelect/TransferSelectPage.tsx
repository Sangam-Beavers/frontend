import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useBalances } from '@/hooks/useBalances';
import styles from './TransferSelectPage.module.css';

// 통화 기호 — HomePage/ExchangeSelect와 동일 패턴 (백엔드는 잔액만 내려보냄).
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

function formatBalance(code: string, balance: string): string {
  const symbol = CURRENCY_SYMBOL[code] ?? '';
  const num = Number(balance);
  if (code === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

export default function TransferSelectPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: balances, isLoading, error } = useBalances();

  // 잔액 0 통화는 표시에서 제외 (ExchangeSelect와 동일 정책).
  const heldBalances = (balances?.balances ?? []).filter((b) => Number(b.balance) > 0);
  const hasWalletError = error instanceof ApiException && error.code === 'WALLET4001';

  const balanceText = isLoading
    ? t('transfer.select.loading')
    : hasWalletError
      ? t('transfer.select.walletNotCreated')
      : heldBalances.length === 0
        ? t('transfer.select.noBalance')
        : heldBalances
            .map((b) => `${b.currency_code} ${formatBalance(b.currency_code, b.balance)}`)
            .join(' · ');

  return (
    <>
      <TopBar title={t('transfer.select.title')} onBack={() => navigate('/')} />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>{t('transfer.select.availableBalance')}</div>
        <div className={styles.cardText}>{balanceText}</div>
      </div>

      <div className={styles.list}>
        <div className={styles.item} onClick={() => navigate('/transfer/app')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>{t('transfer.select.toAppUser')}</div>
            <div className={styles.itemMeta}>{t('transfer.select.toAppUserDesc')}</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/transfer/bank')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>{t('transfer.select.toMyAccount')}</div>
            <div className={styles.itemMeta}>{t('transfer.select.toMyAccountDesc')}</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/recurring')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>{t('transfer.select.recurring')}</div>
            <div className={styles.itemMeta}>{t('transfer.select.recurringDesc')}</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
      </div>
    </>
  );
}
