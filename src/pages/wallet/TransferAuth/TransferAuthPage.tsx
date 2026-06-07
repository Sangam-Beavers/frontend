// ─────────────────────────────────────────────────────────────
// pages/wallet/TransferAuth/TransferAuthPage.tsx — 송금 전 PIN 인증 + 송금 실행
// (방식 B에서는 계정 비밀번호를 우리 DB가 보유하지 않아 별도 "송금 PIN 6자리"로 재설계)
//
// 흐름: PIN 6자리 입력 → POST /api/v1/transfers/pin-verify
//   200 성공      → 서버에 단명·단일사용 마커(TTL 180초) 발급
//                  → 같은 화면에서 즉시 POST /api/v1/transfers (executeTransfer) 자동 호출
//                  → 마커 GETDEL 소비 → 거래 완료
//                  → TransferComplete로 이동 (state에 transferPublicId 포함)
//   TRANSFER4007 → PIN 불일치 (남은 횟수 백엔드 메시지 표시)
//   TRANSFER4008 → 5회 초과로 10분 잠김
//   TRANSFER4009 → PIN 미설정 → 설정 화면으로 (송금 정보 들고 갔다가 복귀)
//
// 한 화면 안에서 검증 → 실행이 연속으로 일어나므로 180초 TX-PIN 마커가 만료될 일이 거의 없다.
// 멱등성 키는 TransferConfirm에서 생성된 단일 키를 받아 그대로 사용 — 뒤로가기 후 재시도해도
// 같은 키로 호출되어 백엔드가 첫 결과를 재반환(이중 송금 방지).
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import type { TransferExecuteRequest } from '@/api/wallet';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useExecuteTransfer } from '@/hooks/useExecuteTransfer';
import { useVerifyTransferPin } from '@/hooks/useVerifyTransferPin';
import { sanitizePinInput } from '@/utils/input';
import styles from './TransferAuthPage.module.css';

interface AuthState {
  recipientName: string;
  /** 받는 대상 보조 정보(내 계좌: "내 계좌 · 123****90"). */
  recipientMeta?: string;
  currency: string;
  amount: string;
  // ─── TransferConfirm이 보강한 송금 실행 body 조립용 필드 ───
  /** 송금 유형. 미지정(레거시) 시 INTERNAL_TRANSFER로 간주(데모 흐름 호환). */
  transferType?: 'INTERNAL_TRANSFER' | 'REMITTANCE';
  receiverPublicId?: string;
  bankAccountPublicId?: string;
  /** 백엔드 요청용 십진수 string. 누락 시 amount 표시값에서 추출 fallback. */
  amountDecimal?: string;
  memo?: string | null;
  /** Confirm에서 생성된 단일 멱등성 키 — Auth는 받아쓰기만. 누락 시 self-fallback. */
  idempotencyKey?: string;
}

const FALLBACK: AuthState = {
  recipientName: 'Linh',
  currency: 'VND',
  amount: '₫1,200,000',
};

/** 표시 문자열("₫1,200,000")에서 백엔드 요청용 십진수("1200000.0000")를 추출. amountDecimal 누락 시 fallback. */
function parseAmount(display: string): string {
  const digits = display.replace(/[^0-9.]/g, '');
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return '';
  return n.toFixed(4);
}

export default function TransferAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as AuthState) ?? FALLBACK;
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const verifyPin = useVerifyTransferPin();
  const executeTransfer = useExecuteTransfer();
  // 한 화면 안의 두 단계(검증 → 실행) 둘 다 진행 중이면 버튼 비활성.
  const busy = verifyPin.isPending || executeTransfer.isPending;

  /**
   * 송금 실행 body 조립 — INTERNAL_TRANSFER + REMITTANCE 둘 다 지원.
   *
   * 1·2단계 same-currency 강제: currency_code === receive_currency_code. 다통화는 3단계로 이연.
   * type 미지정(레거시 fallback)은 INTERNAL_TRANSFER로 간주(receiverPublicId 있을 때만 진행).
   */
  function buildBody(): TransferExecuteRequest | null {
    const currencyCode = state.currency;
    const receiveCurrencyCode = state.currency;
    const amount = state.amountDecimal ?? parseAmount(state.amount);
    if (!amount) return null;
    const memo = state.memo ?? null;

    const type = state.transferType ?? 'INTERNAL_TRANSFER';
    if (type === 'INTERNAL_TRANSFER') {
      if (!state.receiverPublicId) return null;
      return {
        transfer_type: 'INTERNAL_TRANSFER',
        receiver_public_id: state.receiverPublicId,
        amount,
        currency_code: currencyCode,
        receive_currency_code: receiveCurrencyCode,
        memo,
      };
    }
    // REMITTANCE — 본인 등록 외부 계좌로 송금 (예: 가족이 자기 해외 계좌로 환금).
    if (type === 'REMITTANCE') {
      if (!state.bankAccountPublicId) return null;
      return {
        transfer_type: 'REMITTANCE',
        bank_account_public_id: state.bankAccountPublicId,
        amount,
        currency_code: currencyCode,
        receive_currency_code: receiveCurrencyCode,
        memo,
      };
    }
    return null;
  }

  function handleVerifyAndExecute() {
    setError(null);
    const body = buildBody();
    if (!body) {
      setError('송금 정보가 올바르지 않습니다. 이전 화면에서 다시 시도해주세요.');
      return;
    }
    // 멱등성 키 — Confirm에서 받은 키 우선, 누락 시 self-fallback (직접 진입/레거시 대비).
    const idempotencyKey = state.idempotencyKey ?? crypto.randomUUID();

    // 1단계 — PIN 검증 (서버에 단일사용 마커 발급, TTL 180초)
    verifyPin.mutate(
      { pin },
      {
        onSuccess: () => {
          // 2단계 — 같은 화면에서 즉시 송금 실행 (마커 GETDEL 원자 소비)
          executeTransfer.mutate(
            { body, idempotencyKey },
            {
              onSuccess: (res) => {
                navigate(ROUTES.TRANSFER_COMPLETE, {
                  state: {
                    recipientName: state.recipientName,
                    currency: state.currency,
                    amount: state.amount,
                    // Receipt 버튼 활성화용 — 영수증 페이지로 path param 전달
                    transferPublicId: res.public_id,
                  },
                });
              },
              onError: (e) => {
                if (e instanceof ApiException) {
                  // 도메인별 친화 메시지 — 자주 마주칠 코드만 매핑
                  if (e.code === 'WALLET4002') setError('지갑 잔액이 부족합니다.');
                  else if (e.code === 'TRANSFER4010')
                    setError('PIN 검증이 만료되었습니다. 다시 시도해주세요.');
                  else if (e.code === 'TRANSFER4004')
                    setError('자기 자신에게는 송금할 수 없습니다.');
                  else if (e.code === 'TRANSFER4006')
                    setError('송금 요청 횟수를 초과했습니다. 잠시 후 다시 시도해주세요.');
                  // REMITTANCE 전용 — Mock 은행 매핑 결과
                  else if (e.code === 'ACCOUNT4001')
                    setError('등록되지 않은 계좌입니다. 계좌 정보를 다시 확인해주세요.');
                  else if (e.code === 'ACCOUNT4006') setError('인증되지 않은 계좌입니다.');
                  else if (e.code === 'ACCOUNT4003') setError('연동 계좌의 잔액이 부족합니다.');
                  else if (e.code === 'COMMON5031')
                    setError('일시적으로 처리할 수 없습니다. 잠시 후 다시 시도해주세요.');
                  else setError(e.message || '송금에 실패했습니다.');
                } else {
                  setError('송금에 실패했습니다.');
                }
              },
            }
          );
        },
        onError: (e) => {
          if (e instanceof ApiException) {
            if (e.code === 'TRANSFER4009') {
              // PIN 미설정 → 설정 화면으로 (송금 정보 들고 가서 등록 후 다시 돌아온다)
              navigate(ROUTES.TRANSFER_PIN_SETUP, { state });
              return;
            }
            if (e.code === 'TRANSFER4007') {
              setError(e.message || 'PIN이 일치하지 않습니다. 다시 입력해주세요.');
              setPin('');
            } else if (e.code === 'TRANSFER4008') {
              setError(e.message || 'PIN을 5회 잘못 입력했습니다. 10분 후 다시 시도해주세요.');
            } else if (e.code === 'COMMON4291') {
              setError('요청이 너무 잦습니다. 잠시 후 다시 시도해주세요.');
            } else {
              setError(e.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
            }
          } else {
            setError('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
          }
        },
      }
    );
  }

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="송금 PIN 확인" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>송금 전 이중 인증</div>
          <div className={styles.cardText}>안전한 거래를 위해 송금 PIN 6자리를 입력해주세요.</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-pin">
            송금 PIN (숫자 6자리)
          </label>
          <input
            id="auth-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className={styles.input}
            placeholder="6자리 숫자"
            value={pin}
            onChange={(e) => setPin(sanitizePinInput(e.target.value))}
          />
        </div>

        {error && (
          <div className={`${styles.card} ${styles.cardError}`}>
            <div className={styles.cardText}>{error}</div>
          </div>
        )}

        <div className={styles.card}>
          <div className={styles.row}>
            <span>받는 사람</span>
            <b>{state.recipientName}</b>
          </div>
          {state.recipientMeta && (
            <div className={styles.row}>
              <span>받는 계좌</span>
              <b>{state.recipientMeta}</b>
            </div>
          )}
          <div className={styles.row}>
            <span>송금 금액</span>
            <b>
              {state.currency} {state.amount}
            </b>
          </div>
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={pin.length !== 6 || busy}
          onClick={handleVerifyAndExecute}
        >
          {verifyPin.isPending
            ? '확인 중...'
            : executeTransfer.isPending
              ? '송금 중...'
              : '인증 후 송금하기'}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
          이전으로 돌아가기
        </button>
      </div>
    </>
  );
}
