import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException, type ExchangeResponse } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useExchangeHistory } from '@/hooks/useExchangeHistory';
import styles from './ExchangeHistoryPage.module.css';

const PAGE_SIZE = 20;

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

function formatAmount(currency: string, amount: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  const num = Number(amount);
  if (currency === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = formatDate(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}

export default function ExchangeHistoryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ExchangeResponse | null>(null);
  const { data, isLoading, isFetching, error } = useExchangeHistory(page, PAGE_SIZE);

  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  const totalPages = data?.total_pages ?? 0;
  const totalElements = data?.total_elements ?? 0;
  const items = data?.exchanges ?? [];

  const errorMessage =
    error instanceof ApiException
      ? error.message || t('mypage2.exchangeHistory.loadError')
      : error
        ? t('mypage2.exchangeHistory.loadError')
        : null;

  return (
    <>
      <TopBar
        title={t('mypage2.exchangeHistory.title')}
        onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE))}
      />

      {isLoading ? (
        <div className={styles.stateCard}>{t('mypage2.exchangeHistory.loading')}</div>
      ) : errorMessage ? (
        <div className={styles.stateCard} role="alert">
          {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.stateCard}>{t('mypage2.exchangeHistory.empty')}</div>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((tx) => {
              const fromTo = `${tx.from_currency_code} → ${tx.to_currency_code}`;
              const meta = `${formatAmount(tx.from_currency_code, tx.amount)} → ${formatAmount(
                tx.to_currency_code,
                tx.receive_amount
              )} · ${t('mypage2.exchangeHistory.rate')} ${Number(tx.exchange_rate).toLocaleString()}${
                tx.exchange_type === 'RE_EXCHANGE'
                  ? ` · ${t('mypage2.exchangeHistory.reExchange')}`
                  : ''
              }`;
              return (
                <button
                  key={tx.public_id}
                  type="button"
                  className={styles.item}
                  onClick={() => setSelected(tx)}
                >
                  <div className={styles.itemMain}>
                    <div className={styles.itemTitle}>{fromTo}</div>
                    <div className={styles.itemMeta}>{meta}</div>
                  </div>
                  <span className={styles.date}>{formatDate(tx.exchanged_at)}</span>
                </button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                {t('mypage2.exchangeHistory.prev')}
              </button>
              <span className={styles.pageInfo}>
                {t('mypage2.exchangeHistory.pageInfo', {
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
                {t('mypage2.exchangeHistory.next')}
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className={styles.modalBackdrop} onClick={() => setSelected(null)} role="presentation">
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t('mypage2.exchangeHistory.detailTitle')}
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {selected.exchange_type === 'RE_EXCHANGE'
                  ? t('mypage2.exchangeHistory.reExchangeDetailTitle')
                  : t('mypage2.exchangeHistory.detailTitle')}
              </span>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelected(null)}
                aria-label={t('mypage2.exchangeHistory.close')}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}>
                <span>{t('mypage2.exchangeHistory.withdrawal')}</span>
                <b>
                  {formatAmount(selected.from_currency_code, selected.amount)}{' '}
                  {selected.from_currency_code}
                </b>
              </div>
              <div className={styles.modalRow}>
                <span>{t('mypage2.exchangeHistory.deposit')}</span>
                <b>
                  {formatAmount(selected.to_currency_code, selected.receive_amount)}{' '}
                  {selected.to_currency_code}
                </b>
              </div>
              <div className={styles.modalRow}>
                <span>{t('mypage2.exchangeHistory.appliedRate')}</span>
                <b>1 = ₩{Number(selected.exchange_rate).toLocaleString()}</b>
              </div>
              <div className={styles.modalRow}>
                <span>{t('mypage2.exchangeHistory.fee')}</span>
                <b>₩{Number(selected.fee).toLocaleString()}</b>
              </div>
              <div className={styles.modalRow}>
                <span>{t('mypage2.exchangeHistory.status')}</span>
                <b>{selected.status}</b>
              </div>
              <div className={styles.modalRow}>
                <span>{t('mypage2.exchangeHistory.dateTime')}</span>
                <b>{formatDateTime(selected.exchanged_at)}</b>
              </div>
              <div className={styles.modalIdRow}>
                <span>{t('mypage2.exchangeHistory.txId')}</span>
                <code className={styles.modalId}>{selected.public_id}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
