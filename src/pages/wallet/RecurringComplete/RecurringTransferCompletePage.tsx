// ─────────────────────────────────────────────────────────────
// pages/wallet/RecurringComplete/RecurringTransferCompletePage.tsx
// 정기 송금 설정 완료 화면 — RecurringSetup의 createScheduled 응답을 state로 받아 표시.
//
// state shape: { scheduled: ScheduledTransferResponse, recipientName: string | null }
// 직접 URL 진입 등 state가 비어있는 경우는 fallback 텍스트로 안내.
// ─────────────────────────────────────────────────────────────

import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import type { ScheduledTransferResponse } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import styles from './RecurringTransferCompletePage.module.css';

interface CompleteState {
  scheduled: ScheduledTransferResponse;
  recipientName: string | null;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  VND: '₫',
  PHP: '₱',
};

function formatAmount(amount: string, currencyCode: string): string {
  const n = Number(amount);
  const symbol = CURRENCY_SYMBOL[currencyCode] ?? `${currencyCode} `;
  if (Number.isNaN(n)) return `${symbol}${amount}`;
  const noDecimals = currencyCode === 'KRW' || currencyCode === 'VND';
  return `${symbol}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })}`;
}

function formatDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export default function RecurringTransferCompletePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CompleteState | null;

  function formatSchedule(scheduled: ScheduledTransferResponse): string {
    if (scheduled.frequency === 'MONTHLY') {
      return t('recurring.list.monthly', { day: scheduled.schedule_day });
    }
    const WEEKDAY_KEYS = [
      '',
      'weekdayMon',
      'weekdayTue',
      'weekdayWed',
      'weekdayThu',
      'weekdayFri',
      'weekdaySat',
      'weekdaySun',
    ];
    const key = WEEKDAY_KEYS[scheduled.schedule_day];
    const weekday = key ? t(`recurring.list.${key}`) : String(scheduled.schedule_day);
    return t('recurring.list.weekly', { weekday });
  }

  return (
    <>
      <TopBar title={t('recurring.complete.title')} showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('recurring.complete.cardTitle')}</div>
        {state ? (
          <div className={styles.cardText}>
            <b>{state.recipientName ?? t('recurring.complete.recipientFallback')}</b>:{' '}
            {formatAmount(state.scheduled.amount, state.scheduled.currency_code)}
            <br />
            {formatSchedule(state.scheduled)} · {t('recurring.complete.nextRunLabel')}{' '}
            {formatDate(state.scheduled.next_run_date)}
          </div>
        ) : (
          <div className={styles.cardText}>{t('recurring.complete.fallbackText')}</div>
        )}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring')}>
        {t('recurring.complete.viewList')}
      </button>
      <button type="button" className={styles.ghost} onClick={() => navigate('/')}>
        {t('recurring.complete.backHome')}
      </button>
    </>
  );
}
