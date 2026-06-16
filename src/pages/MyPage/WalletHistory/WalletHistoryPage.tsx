import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { buildTransferReceiptPath, ROUTES } from '@/constants/routes';
import { useTransactions } from '@/hooks/useTransactions';
import type { WalletTabKey, WalletTransaction } from '@/types/history';
import { toWalletTransaction } from '@/utils/transactionMapper';
import styles from './WalletHistoryPage.module.css';

const PAGE_SIZE = 20;

interface WalletTab {
  key: WalletTabKey;
  labelKey: string;
}

const TABS: WalletTab[] = [
  { key: 'all', labelKey: 'mypage2.walletHistory.tabs.all' },
  { key: 'charge', labelKey: 'mypage2.walletHistory.tabs.charge' },
  { key: 'send', labelKey: 'mypage2.walletHistory.tabs.send' },
  { key: 'receive', labelKey: 'mypage2.walletHistory.tabs.receive' },
];

const matchesTab = (kind: WalletTransaction['kind'], tab: WalletTabKey) =>
  tab === 'all' || tab === kind;

export default function WalletHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<WalletTabKey>('all');
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching, error } = useTransactions(page, PAGE_SIZE);

  const transactions = useMemo(
    () => (data?.transactions ?? []).map(toWalletTransaction),
    [data?.transactions]
  );
  const visible = transactions.filter((tx) => matchesTab(tx.kind, activeTab));

  const totalPages = data?.total_pages ?? 0;
  const totalElements = data?.total_elements ?? 0;

  const errorMessage =
    error instanceof ApiException
      ? error.message || t('mypage2.walletHistory.loadError')
      : error
        ? t('mypage2.walletHistory.loadError')
        : null;

  const handleItemClick = (tx: WalletTransaction) => {
    if (tx.kind === 'send' && tx.receiptInfo) {
      // path param 기반 — 영수증 페이지가 publicId로 API 조회. state 전달 불필요(새로고침 안전).
      navigate(buildTransferReceiptPath(tx.id));
    }
  };

  return (
    <>
      <ScreenHeader>
        <TopBar
          title={t('mypage2.walletHistory.title')}
          onBack={() => navigate(location.state?.from ?? ROUTES.MYPAGE)}
        />

        <div className={styles.tabs}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </ScreenHeader>

      {isLoading ? (
        <div className={styles.stateCard}>{t('mypage2.walletHistory.loading')}</div>
      ) : errorMessage ? (
        <div className={styles.stateCard} role="alert">
          {errorMessage}
        </div>
      ) : transactions.length === 0 ? (
        <div className={styles.stateCard}>{t('mypage2.walletHistory.empty')}</div>
      ) : visible.length === 0 ? (
        // 페이지 데이터는 있는데 현재 탭 기준으론 비어있는 경우 — 다른 탭이나 다음 페이지를 안내.
        <div className={styles.stateCard}>{t('mypage2.walletHistory.emptyTab')}</div>
      ) : (
        <>
          <div className={styles.list}>
            {visible.map((tx) => (
              <div
                key={tx.id}
                className={`${styles.item} ${
                  tx.kind === 'send' && tx.receiptInfo ? styles.itemClickable : ''
                }`}
                onClick={() => handleItemClick(tx)}
              >
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>{tx.title}</div>
                  <div className={styles.itemMeta}>{tx.meta}</div>
                </div>
                <b
                  className={`${styles.amount} ${
                    tx.isOutgoing ? styles.amountOut : styles.amountIn
                  }`}
                >
                  {tx.amountDisplay}
                </b>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t('mypage2.walletHistory.prev')}
              </button>
              <span className={styles.pageInfo}>
                {t('mypage2.walletHistory.pageInfo', {
                  current: page + 1,
                  total: totalPages,
                  count: totalElements,
                })}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages - 1 || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                {t('mypage2.walletHistory.next')}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
