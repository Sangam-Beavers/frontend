import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import type { ScheduledTransferItem } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import { buildRecurringHistoryPath } from '@/constants/routes';
import { useScheduledTransfers } from '@/hooks/useScheduledTransfers';
import styles from './RecurringTransferListPage.module.css';

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

function formatDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export default function RecurringTransferListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useScheduledTransfers();

  const WEEKDAY_LABEL = [
    '',
    t('recurring.list.weekdayMon'),
    t('recurring.list.weekdayTue'),
    t('recurring.list.weekdayWed'),
    t('recurring.list.weekdayThu'),
    t('recurring.list.weekdayFri'),
    t('recurring.list.weekdaySat'),
    t('recurring.list.weekdaySun'),
  ];

  function formatSchedule(item: ScheduledTransferItem): string {
    if (item.frequency === 'MONTHLY') {
      return t('recurring.list.monthly', { day: item.schedule_day });
    }
    const weekday = WEEKDAY_LABEL[item.schedule_day] ?? `${item.schedule_day}`;
    return t('recurring.list.weekly', { weekday });
  }

  function formatStatusLabel(status: ScheduledTransferItem['status']): string {
    if (status === 'ACTIVE') return t('recurring.list.statusActive');
    if (status === 'PAUSED') return t('recurring.list.statusPaused');
    return t('recurring.list.statusCanceled');
  }

  const items = data?.scheduled_transfers ?? [];
  const hasApiError = error != null;

  const nextScheduled = useMemo(() => {
    const active = items.filter((i) => i.status === 'ACTIVE');
    if (active.length === 0) return null;
    return active.reduce((earliest, cur) =>
      cur.next_run_date < earliest.next_run_date ? cur : earliest
    );
  }, [items]);

  const errorMessage =
    error instanceof ApiException
      ? error.message || t('recurring.list.errLoadFailed')
      : hasApiError
        ? t('recurring.list.errLoadFailed')
        : null;

  return (
    <>
      <TopBar title={t('recurring.list.title')} />

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('recurring.list.loading')}</div>
            </div>
          </div>
        ) : errorMessage ? (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{errorMessage}</div>
            </div>
            <button type="button" className={styles.retryBtn} onClick={() => refetch()}>
              {t('recurring.list.retry')}
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>{t('recurring.list.empty')}</div>
            </div>
          </div>
        ) : (
          items.map((transfer) => (
            <button
              key={transfer.public_id}
              type="button"
              className={styles.item}
              onClick={() => navigate(buildRecurringHistoryPath(transfer.public_id))}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>
                  {transfer.receiver_name ?? t('recurring.list.defaultName')}
                </div>
                <div className={styles.itemMeta}>
                  {formatSchedule(transfer)} ·{' '}
                  {formatAmount(transfer.currency_code, transfer.amount)} ·{' '}
                  {formatStatusLabel(transfer.status)}
                </div>
              </div>
              <span className={styles.pill}>{t('recurring.list.history')}</span>
            </button>
          ))
        )}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring/setup')}>
        {t('recurring.list.createNew')}
      </button>

      {nextScheduled && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('recurring.list.nextScheduled')}</div>
          <div className={styles.cardText}>
            {formatDate(nextScheduled.next_run_date)} ·{' '}
            {nextScheduled.receiver_name ?? t('recurring.list.defaultName')} ·{' '}
            {formatAmount(nextScheduled.currency_code, nextScheduled.amount)}
          </div>
        </div>
      )}
    </>
  );
}
