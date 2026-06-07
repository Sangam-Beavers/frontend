import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useTransferFee } from '@/hooks/useTransferFee';
import type { TransferFeeRequest, TransferKind } from '@/api/wallet';
import styles from './TransferConfirmPage.module.css';

interface TransferState {
  recipientName: string;
  recipientInitial: string;
  /** 이름 아래 보조 설명(흐름별). 내 계좌: "신한은행 123****90", 앱 사용자: undefined → 기본 문구. */
  recipientMeta?: string;
  /** 받는 대상 종류 — 'account'면 아바타를 계좌(카드) 아이콘으로. 미지정(앱 사용자)은 이니셜. */
  recipientKind?: 'account' | 'user';
  currency: string;
  amount: string;
}

const FALLBACK: TransferState = {
  recipientName: 'Linh',
  recipientInitial: 'L',
  currency: 'VND',
  amount: '₫1,200,000',
};

// 통화 기호 (잔액/환전 화면과 동일 맵).
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

/**
 * 표시용 금액 문자열("₫1,200,000")에서 백엔드 요청용 십진수 문자열("1200000.0000")을 만든다.
 * 송금 화면 입력은 정수만 받지만, fallback이나 외부 진입을 대비해 소수도 통과.
 */
function parseAmount(display: string): string {
  const digits = display.replace(/[^0-9.]/g, '');
  const n = Number(digits);
  if (!isFinite(n) || n <= 0) return '';
  return n.toFixed(4);
}

/** 백엔드 응답(소수 4자리 string) → 표시 문자열. KRW는 정수, 외화는 소수 2~4자리. */
function formatMoney(currency: string, amount: string): string {
  const n = Number(amount);
  if (!isFinite(n)) return amount;
  const sym = CURRENCY_SYMBOL[currency] ?? '';
  if (currency === 'KRW') return `${sym}${Math.round(n).toLocaleString()}`;
  return `${sym}${n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/** ApiException code 별 사용자 메시지. */
function feeErrorMessage(err: unknown): string {
  if (err instanceof ApiException) {
    if (err.code === 'TRANSFER4002') return '지원하지 않는 통화입니다.';
    if (err.code === 'TRANSFER4003') return '지원하지 않는 송금 유형입니다.';
    if (err.code === 'COMMON4001') return '입력값을 확인해주세요.';
  }
  return '수수료를 계산하지 못했어요.';
}

export default function TransferConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as TransferState) ?? FALLBACK;
  const [confirmed, setConfirmed] = useState(false);

  // recipientKind로 송금 유형 추론 — 'account'(내/타인 계좌)면 REMITTANCE, 'user'(앱 사용자)면 INTERNAL.
  // recipientKind 미지정(레거시/fallback)은 안전하게 INTERNAL로 간주(수수료 0).
  const transferType: TransferKind =
    state.recipientKind === 'account' ? 'REMITTANCE' : 'INTERNAL_TRANSFER';
  const amountForBody = parseAmount(state.amount);
  const feeBody: TransferFeeRequest | null = amountForBody
    ? {
        transfer_type: transferType,
        currency_code: state.currency,
        amount: amountForBody,
      }
    : null;

  const {
    data: feeData,
    isLoading: feeLoading,
    error: feeError,
    refetch: refetchFee,
  } = useTransferFee(feeBody);

  // 송금하기 활성 조건: 사용자 확인 ✓ + 수수료 계산 완료(에러 없음·로딩 아님·데이터 존재).
  const canSubmit = confirmed && !!feeData && !feeLoading && !feeError;

  return (
    <>
      <TopBar title="송금 확인" onBack={() => navigate(-1)} />

      <div className={styles.card}>
        <div className={styles.recipientRow}>
          <div className={styles.avatar}>
            {state.recipientKind === 'account' ? (
              <svg
                className={styles.avatarIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2.5" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ) : (
              state.recipientInitial
            )}
          </div>
          <div className={styles.recipientInfo}>
            <div className={styles.recipientName}>
              {state.recipientName}
              <span className={styles.pill}>인증</span>
            </div>
            <div className={styles.recipientMeta}>
              {state.recipientMeta ?? '앱 사용자에게 보내기'}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>보낼 통화</span>
          <b>{state.currency}</b>
        </div>
        <div className={styles.row}>
          <span>보낼 금액</span>
          <b>{state.amount}</b>
        </div>
        <div className={styles.row}>
          <span>수수료</span>
          <b>
            {feeLoading
              ? '계산 중…'
              : feeError
                ? feeErrorMessage(feeError)
                : feeData
                  ? formatMoney(feeData.fee_currency_code, feeData.fee)
                  : '—'}
          </b>
        </div>
        <div className={styles.row}>
          <span>최종 차감</span>
          <b>
            {feeLoading
              ? '계산 중…'
              : feeData
                ? formatMoney(feeData.fee_currency_code, feeData.total_deduct_amount)
                : state.amount}
          </b>
        </div>
        {feeError && (
          <div className={styles.row}>
            <span></span>
            <button
              type="button"
              className={styles.secondaryBtn}
              style={{ flex: 'none', padding: '6px 14px', fontSize: 12 }}
              onClick={() => refetchFee()}
            >
              다시 시도
            </button>
          </div>
        )}
      </div>

      <div className={`${styles.card} ${styles.cardOk}`}>
        <div className={styles.cardTitle}>이상거래 탐지 결과</div>
        <div className={styles.cardText}>안전한 거래로 확인되었습니다.</div>
      </div>

      <div className={styles.checkRow} onClick={() => setConfirmed((v) => !v)}>
        <span>송금 정보를 확인했습니다</span>
        <div className={`${styles.checkbox} ${confirmed ? styles.checkboxChecked : ''}`}>
          {confirmed && '✓'}
        </div>
      </div>

      <div className={styles.btnRow}>
        <button type="button" className={styles.secondaryBtn} onClick={() => navigate(-1)}>
          수정하기
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!canSubmit}
          onClick={() =>
            navigate('/transfer/auth', {
              state: {
                recipientName: state.recipientName,
                recipientInitial: state.recipientInitial,
                recipientMeta: state.recipientMeta,
                currency: state.currency,
                amount: state.amount,
              },
            })
          }
        >
          송금하기
        </button>
      </div>
    </>
  );
}
