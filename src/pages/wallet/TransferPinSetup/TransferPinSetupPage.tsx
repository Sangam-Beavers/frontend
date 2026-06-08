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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('transfer.pinSetup.errorPinLength'));
      return;
    }
    if (pin !== confirm) {
      setError(t('transfer.pinSetup.errorPinMismatch'));
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
              setError(retryErr.message || t('transfer.pinSetup.errorRequest'));
            } else {
              setError(t('transfer.pinSetup.errorRequest'));
            }
          }
        } else if (e.code === 'NETWORK_ERROR') {
          setError(t('transfer.pinSetup.errorNetwork'));
        } else {
          setError(e.message || t('transfer.pinSetup.errorRequest'));
        }
      } else {
        setError(t('transfer.pinSetup.errorRequest'));
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
          <TopBar title={t('transfer.pinSetup.title')} onBack={goNext} />
          <div className={`${styles.card} ${styles.cardOk}`}>
            <div className={styles.cardTitle}>
              {done ? t('transfer.pinSetup.doneTitle') : t('transfer.pinSetup.alreadySetTitle')}
            </div>
            <div className={styles.cardText}>
              {transferState
                ? t('transfer.pinSetup.doneTextResume')
                : t('transfer.pinSetup.doneTextGeneric')}
            </div>
          </div>
        </div>
        <div className={styles.fixedBtn}>
          <button type="button" className={styles.primaryBtn} onClick={goNext}>
            {transferState ? t('transfer.pinSetup.continueTransfer') : t('transfer.pinSetup.ok')}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('transfer.pinSetup.title')} onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>{t('transfer.pinSetup.registerTitle')}</div>
          <div className={styles.cardText}>
            {t('transfer.pinSetup.registerText1')}
            <br />
            {t('transfer.pinSetup.registerText2')}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pin-setup">
            {t('transfer.pinSetup.pinLabel')}
          </label>
          <input
            id="pin-setup"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className={styles.input}
            placeholder={t('transfer.pinSetup.pinPlaceholder')}
            value={pin}
            onChange={(e) => setPin(sanitizePinInput(e.target.value))}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="pin-setup-confirm">
            {t('transfer.pinSetup.pinConfirmLabel')}
          </label>
          <input
            id="pin-setup-confirm"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className={styles.input}
            placeholder={t('transfer.pinSetup.pinConfirmPlaceholder')}
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
          {submitting ? t('transfer.pinSetup.submitting') : t('transfer.pinSetup.submit')}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
          {t('transfer.pinSetup.back')}
        </button>
      </div>
    </>
  );
}
