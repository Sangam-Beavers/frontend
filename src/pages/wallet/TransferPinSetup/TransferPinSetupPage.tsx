// ─────────────────────────────────────────────────────────────
// pages/wallet/TransferPinSetup/TransferPinSetupPage.tsx — 송금 PIN 최초 등록 화면
// PIN은 계정 비밀번호와 별개로 새로 설계된 기능이라 와이어프레임에 없는 신규 화면.
//
// 진입 경로 2가지:
//   1) TransferAuthPage에서 PIN 미설정(TRANSFER4009) → 송금 정보(state)를 들고 이리로 옴.
//      등록 끝나면 "송금 계속하기"로 다시 인증 화면 복귀.
//   2) (추후) 마이페이지 등에서 직접 진입 — state 없음, 등록 후 이전 화면으로.
//
// 흐름: 6자리 숫자 2회 입력(확인) → POST /api/v1/transfers/pin { pin } → 201 완료.
//   COMMON4091 = 이미 등록됨(재설정 API는 없음 — 별도 안내).
// PIN 원문은 어디에도 저장·로그하지 않는다(백엔드는 BCrypt 해시만 저장).
// ─────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiException, walletApi } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { sanitizePinInput } from '@/utils/input';
import styles from './TransferPinSetupPage.module.css';

// TransferAuthPage에서 넘어올 때 들고 오는 송금 정보(등록 후 복귀용)
interface AuthState {
  recipientName: string;
  currency: string;
  amount: string;
}

/** 신분증 인증 완료 직후 진입(이슈 #108) — 등록 완료 시 홈으로 가도록 분기. */
interface OnboardingState {
  fromOnboarding: true;
}

type IncomingState = AuthState | OnboardingState | null;

export default function TransferPinSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const incomingState = (location.state as IncomingState) ?? null;
  // 송금 인증에서 PIN 미설정으로 튕긴 경우 — 등록 후 송금 인증 화면으로 복귀하기 위해 들고 옴.
  const transferState = incomingState && 'recipientName' in incomingState ? incomingState : null;
  // 신분증 인증 완료 직후 — 등록 완료 시 마이페이지/완료 페이지로 돌아가지 않고 홈으로 바로.
  const fromOnboarding =
    incomingState !== null && 'fromOnboarding' in incomingState && incomingState.fromOnboarding;

  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false); // 등록 완료
  const [alreadySet, setAlreadySet] = useState(false); // COMMON4091 — 이미 등록됨
  const [error, setError] = useState<string | null>(null);

  // 완료/이미등록 후 이동:
  //   1) 송금 흐름에서 왔으면 인증 화면으로 복귀
  //   2) 신분증 인증 직후 온보딩이면 홈으로 (인증 완료 페이지 다시 보일 필요 없음 — replace)
  //   3) 그 외(마이페이지 등 직접 진입)는 이전 화면으로
  const goNext = () => {
    if (transferState) {
      navigate(ROUTES.TRANSFER_AUTH, { state: transferState, replace: true });
    } else if (fromOnboarding) {
      navigate(ROUTES.HOME, { replace: true });
    } else {
      navigate(-1);
    }
  };

  const handleSubmit = async () => {
    setError(null);

    if (pin.length !== 6) {
      setError('PIN은 숫자 6자리로 입력해주세요.');
      return;
    }
    if (pin !== confirm) {
      setError('PIN이 서로 일치하지 않습니다. 다시 확인해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      // 성공(201)이면 그냥 통과 — interceptor가 envelope을 풀고, 실패는 전부 ApiException throw.
      await walletApi.setTransferPin({ pin });
      setDone(true); // 등록 완료
    } catch (e) {
      if (e instanceof ApiException) {
        if (e.code === 'COMMON4091') {
          setAlreadySet(true); // 이미 PIN이 있음 → 입력 화면으로 보내기
        } else if (e.code === 'WALLET4001') {
          // 인증은 됐지만 지갑 자동 개설이 안 된 케이스(이슈 #108) — 멱등 createWallet으로 보정 후
          // PIN 설정을 한 번 더 시도한다. 두 번째 시도도 실패하면 일반 에러로 안내.
          try {
            await walletApi.createWallet();
            await walletApi.setTransferPin({ pin });
            setDone(true);
          } catch (retryErr) {
            if (retryErr instanceof ApiException && retryErr.code === 'COMMON4091') {
              setAlreadySet(true);
            } else if (retryErr instanceof ApiException) {
              setError(
                retryErr.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.'
              );
            } else {
              setError('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
            }
          }
        } else if (e.code === 'NETWORK_ERROR') {
          setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(e.message || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        setError('요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 완료/이미등록 화면 (폼 대신 안내 + 다음 버튼)
  if (done || alreadySet) {
    return (
      <>
        <div className={styles.contentExtraPad}>
          <TopBar title="송금 PIN 설정" onBack={goNext} />
          <div className={`${styles.card} ${styles.cardOk}`}>
            <div className={styles.cardTitle}>
              {done ? '송금 PIN이 등록되었습니다' : '이미 송금 PIN이 등록되어 있습니다'}
            </div>
            <div className={styles.cardText}>
              {transferState
                ? '진행 중이던 송금으로 돌아가 PIN을 입력해주세요.'
                : '송금할 때 등록한 PIN 6자리를 입력하면 됩니다.'}
            </div>
          </div>
        </div>
        <div className={styles.fixedBtn}>
          <button type="button" className={styles.primaryBtn} onClick={goNext}>
            {transferState ? '송금 계속하기' : '확인'}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="송금 PIN 설정" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>송금 PIN 등록</div>
          <div className={styles.cardText}>
            앞으로 송금할 때 입력할 숫자 6자리를 정해주세요.
            <br />
            5회 잘못 입력하면 10분 동안 잠깁니다.
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pin-setup">
            송금 PIN (숫자 6자리)
          </label>
          <input
            id="pin-setup"
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

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pin-setup-confirm">
            송금 PIN 확인
          </label>
          <input
            id="pin-setup-confirm"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className={styles.input}
            placeholder="한 번 더 입력"
            value={confirm}
            onChange={(e) => setConfirm(sanitizePinInput(e.target.value))}
          />
        </div>

        {error && (
          <div className={`${styles.card} ${styles.cardError}`}>
            <div className={styles.cardText}>{error}</div>
          </div>
        )}
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={pin.length !== 6 || confirm.length !== 6 || submitting}
          onClick={handleSubmit}
        >
          {submitting ? '등록 중...' : 'PIN 등록하기'}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
          이전으로 돌아가기
        </button>
      </div>
    </>
  );
}
