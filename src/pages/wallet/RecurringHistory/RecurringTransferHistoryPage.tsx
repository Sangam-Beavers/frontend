// ─────────────────────────────────────────────────────────────
// pages/wallet/RecurringHistory/RecurringTransferHistoryPage.tsx
// 정기 송금 회차 실행 이력 (api-spec — GET /api/v1/transfers/scheduled/{id}/history)
//
// 데이터: useScheduledHistory(transferPublicId, page, size) → walletApi.getScheduledHistory
// 라우트: /recurring/:transferPublicId/history
//
// 상태:
//   로딩         → 안내 카드
//   에러         → 에러 메시지 (TRANSFER4001은 본인 아님·미존재 모호 매핑 → 단일 메시지)
//   빈 결과      → "아직 실행된 회차가 없습니다"
//   정상         → 회차별 카드 + 페이지네이션 (prev/next, totalPages>1일 때만)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useScheduledHistory } from '@/hooks/useScheduledHistory';
import styles from './RecurringTransferHistoryPage.module.css';

const PAGE_SIZE = 20;

/** 통화 기호 — 다른 페이지와 동일. */
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  VND: '₫',
  PHP: '₱',
};
const currencySymbol = (code: string) => CURRENCY_SYMBOL[code] ?? `${code} `;

/** 거래 상태 라벨. 현 단계는 백엔드가 COMPLETED만 기록하지만 향후 확장 대비. */
const STATUS_LABEL: Record<string, string> = {
  COMPLETED: '완료',
  PENDING: '대기',
  PROCESSING: '처리중',
  FAILED: '실패',
  CANCELLED: '취소',
};

/** BigDecimal string → 천단위 콤마 + 통화별 소수 자릿수. */
function formatAmount(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currencySymbol(currencyCode)}${amount}`;
  const noDecimals = currencyCode === 'KRW' || currencyCode === 'VND';
  return `${currencySymbol(currencyCode)}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })}`;
}

/** ISO 8601 UTC Z → "YYYY.MM.DD HH:mm" (사용자 로컬). */
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

export default function RecurringTransferHistoryPage() {
  const navigate = useNavigate();
  const { transferPublicId = '' } = useParams<{ transferPublicId: string }>();
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching, error } = useScheduledHistory(
    transferPublicId,
    page,
    PAGE_SIZE
  );

  // 본인 아님·미존재 모두 TRANSFER4001로 모호 매핑되므로 단일 메시지.
  const errorMessage =
    error instanceof ApiException
      ? error.code === 'TRANSFER4001'
        ? '정기 송금 이력을 찾을 수 없습니다.'
        : error.message || '이력을 불러오지 못했습니다.'
      : error
        ? '이력을 불러오지 못했습니다.'
        : null;

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 0;
  const totalElements = data?.total_elements ?? 0;

  return (
    <>
      <TopBar title="정기 송금 진행 내역" onBack={() => navigate(-1)} />

      {isLoading ? (
        <div className={styles.stateCard}>불러오는 중...</div>
      ) : errorMessage ? (
        <div className={styles.stateCard} role="alert">
          {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.stateCard}>아직 실행된 회차가 없습니다.</div>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((item) => (
              <div key={item.public_id} className={styles.item}>
                <div className={styles.itemMain}>
                  <div className={styles.itemTitle}>
                    {formatAmount(item.amount, item.currency_code)}
                    {item.currency_code !== item.receive_currency_code && (
                      <> → {formatAmount(item.receive_amount, item.receive_currency_code)}</>
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    {formatDateTime(item.executed_at)}
                    {Number(item.fee) > 0 && (
                      <> · 수수료 {formatAmount(item.fee, item.currency_code)}</>
                    )}
                  </div>
                </div>
                <span className={styles.statusBadge}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
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
                이전
              </button>
              <span className={styles.pageInfo}>
                {page + 1} / {totalPages} (총 {totalElements}건)
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages - 1 || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
