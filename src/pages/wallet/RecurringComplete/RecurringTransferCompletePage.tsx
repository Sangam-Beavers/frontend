// ─────────────────────────────────────────────────────────────
// pages/wallet/RecurringComplete/RecurringTransferCompletePage.tsx
// 정기 송금 설정 완료 화면 — RecurringSetup의 createScheduled 응답을 state로 받아 표시.
//
// state shape: { scheduled: ScheduledTransferResponse, recipientName: string | null }
// 직접 URL 진입 등 state가 비어있는 경우는 fallback 텍스트로 안내.
// ─────────────────────────────────────────────────────────────

import { useLocation, useNavigate } from 'react-router-dom';
import type { ScheduledTransferResponse } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import styles from './RecurringTransferCompletePage.module.css';

interface CompleteState {
  scheduled: ScheduledTransferResponse;
  recipientName: string | null;
}

/** 통화 기호 — 다른 페이지와 동일. */
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

/** WEEKLY 1~7(ISO 월=1) → "매주 X요일", MONTHLY 1~31 → "매월 N일". */
function formatSchedule(scheduled: ScheduledTransferResponse): string {
  const WEEKDAYS = ['', '월', '화', '수', '목', '금', '토', '일'];
  if (scheduled.frequency === 'MONTHLY') {
    return `매월 ${scheduled.schedule_day}일`;
  }
  const weekday = WEEKDAYS[scheduled.schedule_day] ?? String(scheduled.schedule_day);
  return `매주 ${weekday}요일`;
}

/** ISO date(YYYY-MM-DD) → "YYYY.MM.DD". */
function formatDate(isoDate: string): string {
  return isoDate.replaceAll('-', '.');
}

export default function RecurringTransferCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // state가 빈 경우 안전 가드 — 직접 URL 접근/새로고침 시 mock 텍스트 대신 안내.
  const state = location.state as CompleteState | null;

  return (
    <>
      <TopBar title="정기 송금 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>정기 송금이 등록되었습니다</div>
        {state ? (
          <div className={styles.cardText}>
            {state.recipientName ? <b>{state.recipientName}</b> : '수신자'}에게{' '}
            {formatAmount(state.scheduled.amount, state.scheduled.currency_code)}
            <br />
            {formatSchedule(state.scheduled)} 정기 송금 · 다음 실행{' '}
            {formatDate(state.scheduled.next_run_date)}
          </div>
        ) : (
          <div className={styles.cardText}>정기 송금이 정상적으로 등록되었습니다.</div>
        )}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring')}>
        정기 송금 내역 보기
      </button>
      <button type="button" className={styles.ghost} onClick={() => navigate('/')}>
        홈으로 돌아가기
      </button>
    </>
  );
}
