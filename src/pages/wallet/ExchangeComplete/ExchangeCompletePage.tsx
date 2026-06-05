// ─────────────────────────────────────────────────────────────
// pages/wallet/ExchangeComplete/ExchangeCompletePage.tsx — 환전 완료 화면
//
// ExchangeForm/Reverse가 execute API 성공 후 응답(ExchangeResponse)을
// location.state.result 로 전달한다. 새로고침/직접 접근으로 state가 없으면
// fallback 안내를 보여준다(거래는 이미 일어난 상태일 수 있으니 내역 화면 안내).
// ─────────────────────────────────────────────────────────────

import { useLocation, useNavigate } from 'react-router-dom';
import type { ExchangeResponse } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import styles from './ExchangeCompletePage.module.css';

interface CompleteState {
  result?: ExchangeResponse;
}

// 통화별 기호 매핑 (백엔드 응답에 기호가 안 담겨 와서 클라이언트에서 보강).
// supported-currencies와 동일하지만 Complete 화면은 캐시 의존 없이 즉시 표시하기 위해 인라인.
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

function formatAmount(currency: string, amount: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  // 백엔드는 소수 4자리 string("100000.0000")으로 내려준다. KRW는 정수 표기, 외화는 소수 2자리.
  const num = Number(amount);
  if (currency === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

export default function ExchangeCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CompleteState | null;
  const result = state?.result;
  const rateDisplayCurrency =
    result &&
    (result.to_currency_code === 'KRW' ? result.from_currency_code : result.to_currency_code);

  return (
    <>
      <TopBar title="환전 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>
          {result?.exchange_type === 'RE_EXCHANGE'
            ? '재환전이 완료되었습니다'
            : '환전이 완료되었습니다'}
        </div>
        <div className={styles.cardText}>
          {result ? (
            <>
              {formatAmount(result.from_currency_code, result.amount)} {result.from_currency_code} →{' '}
              {formatAmount(result.to_currency_code, result.receive_amount)}{' '}
              {result.to_currency_code}
              <br />
              적용 환율 1 {rateDisplayCurrency} = ₩{Number(result.exchange_rate).toLocaleString()} ·
              수수료 ₩{Number(result.fee).toLocaleString()}
            </>
          ) : (
            '환전이 정상적으로 처리되었습니다. 내역에서 자세한 정보를 확인하실 수 있습니다.'
          )}
        </div>
      </div>

      <button
        className={styles.primaryBtn}
        onClick={() => navigate(ROUTES.MYPAGE_EXCHANGE_HISTORY)}
      >
        환전 내역 보기
      </button>
      <button className={styles.ghostBtn} onClick={() => navigate(ROUTES.HOME)}>
        홈으로 돌아가기
      </button>
    </>
  );
}
