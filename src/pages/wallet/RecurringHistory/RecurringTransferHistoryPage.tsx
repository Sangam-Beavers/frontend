import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useScheduledHistory } from '@/hooks/useScheduledHistory';
import styles from './RecurringTransferHistoryPage.module.css';

const PAGE_SIZE = 20;

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  VND: '₫',
  PHP: '₱',
};
const currencySymbol = (code: string) => CURRENCY_SYMBOL[code] ?? `${code} `;

function formatAmount(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currencySymbol(currencyCode)}${amount}`;
  const noDecimals = currencyCode === 'KRW' || currencyCode === 'VND';
  return `${currencySymbol(currencyCode)}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })}`;
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

export default function RecurringTransferHistoryPage() {
  const { t } = useTranslation();
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
        ? t('recurring.history.notFound')
        : error.message || t('recurring.history.loadError')
      : error
        ? t('recurring.history.loadError')
        : null;

  const items = data?.items ?? [];
  const totalPages = data?.total_pages ?? 0;
  const totalElements = data?.total_elements ?? 0;

  return (
    <>
      <TopBar title={t('recurring.history.title')} onBack={() => navigate(ROUTES.RECURRING)} />

      {isLoading ? (
        <div className={styles.stateCard}>{t('recurring.history.loading')}</div>
      ) : errorMessage ? (
        <div className={styles.stateCard} role="alert">
          {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.stateCard}>{t('recurring.history.empty')}</div>
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
                      <>
                        {' '}
                        · {t('recurring.history.fee')} {formatAmount(item.fee, item.currency_code)}
                      </>
                    )}
                  </div>
                </div>
                <span className={styles.statusBadge}>
                  {t(`recurring.history.status.${item.status}`, { defaultValue: item.status })}
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
                {t('recurring.history.prev')}
              </button>
              <span className={styles.pageInfo}>
                {t('recurring.history.pageInfo', {
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
                {t('recurring.history.next')}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
