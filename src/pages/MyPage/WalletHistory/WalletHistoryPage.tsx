// ─────────────────────────────────────────────────────────────
// pages/MyPage/WalletHistory/WalletHistoryPage.tsx — 전자지갑 거래내역
//
// 데이터: useTransactions(page, size) → walletApi.getTransactions
//   - 백엔드는 본인이 송신자 또는 수신자인 전 유형 거래를 OR 조회로 묶어 반환(api-spec §3).
//   - 백엔드 raw 응답(TransactionHistoryItem)은 transactionMapper로 화면 모델(WalletTransaction)로 변환.
//
// 탭 필터(전체/충전/송금/받기): 클라이언트 측 필터. 백엔드에 type 필터 파라미터가 없어 페이지 전체를
//   받은 뒤 화면에서 거른다. 결과적으로 한 페이지 안에서 필터 후 표시 건수가 size보다 작을 수 있다 — TODO:
//   백엔드에 type filter param 추가 검토.
//
// 상태:
//   로딩         → 안내 카드
//   빈 결과      → "거래 내역이 없습니다"
//   에러         → 에러 메시지 (AUTH4011은 apiClient interceptor가 로그인 화면으로 이동)
//   정상         → 탭 + 리스트 + 페이지네이션 (prev/next, totalPages>1일 때만)
//   송금 클릭    → /transfer/receipt로 영수증 페이지 이동 (mock 패턴 유지)
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
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

  // 백엔드 raw → 화면 모델 변환은 응답 바뀔 때만 (탭 전환 시 재계산 회피).
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
