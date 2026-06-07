import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import type { ScheduledTransferItem } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import { buildRecurringHistoryPath } from '@/constants/routes';
import { useScheduledTransfers } from '@/hooks/useScheduledTransfers';
import styles from './RecurringTransferListPage.module.css';

const WEEKDAY_LABEL = ['', '월', '화', '수', '목', '금', '토', '일'];

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

function formatAmount(currencyCode: string, amount: string): string {
  const symbol = CURRENCY_SYMBOL[currencyCode] ?? '';
  const num = Number(amount);
  if (currencyCode === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

function formatSchedule(item: ScheduledTransferItem): string {
  if (item.frequency === 'MONTHLY') {
    return `매월 ${item.schedule_day}일`;
  }
  // WEEKLY: schedule_day가 1~7(ISO, 1=월)
  const weekday = WEEKDAY_LABEL[item.schedule_day] ?? `${item.schedule_day}`;
  return `매주 ${weekday}요일`;
}

function formatStatusLabel(status: ScheduledTransferItem['status']): string {
  if (status === 'ACTIVE') return '활성';
  if (status === 'PAUSED') return '일시정지';
  return '취소됨';
}

// "2026-06-25" (next_run_date는 ISO date) → "2026.06.25" 식 표시
function formatDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export default function RecurringTransferListPage() {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useScheduledTransfers();
  const items = data?.scheduled_transfers ?? [];
  const hasApiError = error != null;

  // "다음 예정 송금" 카드 — ACTIVE 항목 중 next_run_date가 가장 빠른 1건.
  // 백엔드 별도 API 없음. 응답에서 합성.
  const nextScheduled = useMemo(() => {
    const active = items.filter((i) => i.status === 'ACTIVE');
    if (active.length === 0) return null;
    return active.reduce((earliest, cur) =>
      cur.next_run_date < earliest.next_run_date ? cur : earliest
    );
  }, [items]);

  const errorMessage =
    error instanceof ApiException
      ? error.message || '정기 송금 목록을 불러오지 못했습니다.'
      : hasApiError
        ? '정기 송금 목록을 불러오지 못했습니다.'
        : null;

  return (
    <>
      <TopBar title="정기 송금 내역" />

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>불러오는 중…</div>
            </div>
          </div>
        ) : errorMessage ? (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{errorMessage}</div>
            </div>
            <button type="button" className={styles.retryBtn} onClick={() => refetch()}>
              다시 시도
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>등록된 정기 송금이 없어요.</div>
            </div>
          </div>
        ) : (
          items.map((transfer) => (
            <button
              key={transfer.public_id}
              type="button"
              className={styles.item}
              // 행 클릭 시 해당 정기 송금의 회차 실행 이력 페이지로 이동
              // (api-spec — GET /transfers/scheduled/{id}/history).
              onClick={() => navigate(buildRecurringHistoryPath(transfer.public_id))}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{transfer.receiver_name ?? '정기 송금'}</div>
                <div className={styles.itemMeta}>
                  {formatSchedule(transfer)} ·{' '}
                  {formatAmount(transfer.currency_code, transfer.amount)} ·{' '}
                  {formatStatusLabel(transfer.status)}
                </div>
              </div>
              <span className={styles.pill}>내역</span>
            </button>
          ))
        )}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring/setup')}>
        새 정기 송금 만들기
      </button>

      {/* 다음 예정 송금 — ACTIVE 중 가장 빠른 next_run_date 1건 (응답에서 합성).
          ACTIVE 항목 없으면 카드 숨김. */}
      {nextScheduled && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>다음 예정 송금</div>
          <div className={styles.cardText}>
            {formatDate(nextScheduled.next_run_date)} · {nextScheduled.receiver_name ?? '정기 송금'}{' '}
            · {formatAmount(nextScheduled.currency_code, nextScheduled.amount)}
          </div>
        </div>
      )}
    </>
  );
}
