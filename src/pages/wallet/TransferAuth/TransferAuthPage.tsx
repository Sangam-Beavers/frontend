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
import { useTranslation } from 'react-i18next';
import { ApiException, walletApi } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { sanitizePinInput } from '@/utils/input';
import styles from './TransferAuthPage.module.css';

interface AuthState {
  recipientName: string;
  /** 받는 대상 보조 정보(내 계좌: "내 계좌 · 123****90"). */
  recipientMeta?: string;
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
  const { t } = useTranslation();
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
          setError(e.message || t('transfer.auth.errorPinMismatch'));
          setPin('');
        } else if (e.code === 'TRANSFER4008') {
          setError(e.message || t('transfer.auth.errorPinLocked'));
        } else if (e.code === 'NETWORK_ERROR') {
          setError(t('transfer.auth.errorNetwork'));
        } else {
          setError(e.message || t('transfer.auth.errorRequest'));
        }
      } else {
        setError(t('transfer.auth.errorRequest'));
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('transfer.auth.title')} onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>{t('transfer.auth.warningTitle')}</div>
          <div className={styles.cardText}>{t('transfer.auth.warningText')}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-pin">
            {t('transfer.auth.pinLabel')}
          </label>
          <input
            id="auth-pin"
            type="password"
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            className={styles.input}
            placeholder={t('transfer.auth.pinPlaceholder')}
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
            <span>{t('transfer.auth.recipient')}</span>
            <b>{state.recipientName}</b>
          </div>
          {state.recipientMeta && (
            <div className={styles.row}>
              <span>{t('transfer.auth.recipientAccount')}</span>
              <b>{state.recipientMeta}</b>
            </div>
          )}
          <div className={styles.row}>
            <span>{t('transfer.auth.amount')}</span>
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
          {verifying ? t('transfer.auth.verifying') : t('transfer.auth.submit')}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
          {t('transfer.auth.back')}
        </button>
      </div>
    </>
  );
}
