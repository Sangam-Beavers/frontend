// ─────────────────────────────────────────────────────────────
// pages/wallet/TransferAuth/TransferAuthPage.tsx — 송금 전 PIN 인증 화면
// (원래 "계정 비밀번호" 재입력 설계였지만, 방식 B에서는 비밀번호를 우리 DB가
//  갖고 있지 않아 별도 "송금 PIN 6자리"로 재설계됨 — 백엔드 #127)
//
// 흐름: PIN 6자리 입력 → POST /api/v1/transfers/pin-verify { pin }
//   200 성공      → 송금 진행(현재는 완료 화면으로 이동. TODO: 송금 생성 API 연동 — 담당자 구현 후)
//   TRANSFER4007 → PIN 불일치 (남은 횟수 백엔드 메시지 표시)
//   TRANSFER4008 → 5회 초과로 10분 잠김
//   TRANSFER4009 → PIN 미설정 → 설정 화면으로 (송금 정보 들고 갔다가 복귀)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException, walletApi } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { sanitizePinInput } from '@/utils/input';
import styles from './TransferAuthPage.module.css';

interface AuthState {
  recipientName: string;
  currency: string;
  amount: string;
}

const FALLBACK: AuthState = {
  recipientName: 'Linh',
  currency: 'VND',
  amount: '₫1,200,000',
};

export default function TransferAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as AuthState) ?? FALLBACK;
  const [pin, setPin] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    try {
      // 성공(200)이면 그냥 통과 — interceptor가 envelope을 풀고, 실패는 전부 ApiException throw.
      await walletApi.verifyTransferPin({ pin });

      // PIN 통과 → 송금 진행.
      // TODO: 송금 생성 API(다른 담당) 연동 후, 그 성공 응답을 받아 완료 화면으로 이동하게 교체.
      navigate(ROUTES.TRANSFER_COMPLETE, {
        state: {
          recipientName: state.recipientName,
          currency: state.currency,
          amount: state.amount,
        },
      });
    } catch (e) {
      if (e instanceof ApiException) {
        if (e.code === 'TRANSFER4009') {
          // PIN 미설정 → 설정 화면으로 (송금 정보를 들고 가서 등록 후 다시 돌아온다)
          navigate(ROUTES.TRANSFER_PIN_SETUP, { state });
          return;
        }
        if (e.code === 'TRANSFER4007') {
          // 불일치 — 백엔드 메시지에 남은 횟수 안내가 있으면 그대로 보여준다
          setError(e.message || 'PIN이 일치하지 않습니다. 다시 입력해주세요.');
          setPin('');
        } else if (e.code === 'TRANSFER4008') {
          setError(e.message || 'PIN을 5회 잘못 입력했습니다. 10분 후 다시 시도해주세요.');
        } else if (e.code === 'NETWORK_ERROR') {
          setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(e.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setError('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setVerifying(false);
    }
  };

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
          disabled={pin.length !== 6 || verifying}
          onClick={handleVerify}
        >
          {verifying ? '확인 중...' : '인증 후 송금하기'}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
          이전으로 돌아가기
        </button>
      </div>
    </>
  );
}
