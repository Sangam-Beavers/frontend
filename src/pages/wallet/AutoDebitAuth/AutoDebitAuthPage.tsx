import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ApiException } from '@/api';
import { useVerifyAccount } from '@/hooks/useVerifyAccount';
import { useConfirmAccount } from '@/hooks/useConfirmAccount';
import { useRegisterAccount } from '@/hooks/useRegisterAccount';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import type { AuthStep, AccountRegisterDraft, RegisteredAccountView } from '@/types/charge';
import styles from './AutoDebitAuthPage.module.css';

/** ISO 8601 문자열로부터 남은 초를 계산. 0 미만이면 0 반환. */
function secondsLeft(expiresAt: string): number {
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
}

/** 초를 "MM:SS" 형식으로 변환. */
function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function AutoDebitAuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const draft = state as AccountRegisterDraft | null;

  const verify = useVerifyAccount();
  const confirm = useConfirmAccount();
  const register = useRegisterAccount();

  const [otpCode, setOtpCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isPending = verify.isSuccess && !!expiresAt && !confirm.isSuccess;
  const isConfirmed = confirm.isSuccess;

  // 이미 등록된 계좌(409) — 재시도 대신 계좌 목록으로 유도.
  const alreadyRegistered =
    register.error instanceof ApiException && register.error.code === 'ACCOUNT4004';

  // 만료 카운트다운 타이머
  useEffect(() => {
    if (!expiresAt) return;

    setCountdown(secondsLeft(expiresAt));
    timerRef.current = setInterval(() => {
      setCountdown(secondsLeft(expiresAt));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [expiresAt]);

  // 계좌 정보 없이 직접 진입(새로고침 등) — 계좌 추가로 유도.
  if (!draft) {
    return (
      <>
        <TopBar
          title={t('charge.autoDebit.title')}
          onBack={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
        />
        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>{t('charge.autoDebit.noDraftTitle')}</div>
          <div className={styles.cardText}>{t('charge.autoDebit.noDraftText')}</div>
        </div>
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/charge/add-account')}
        >
          {t('charge.autoDebit.goAddAccount')}
        </button>
      </>
    );
  }

  const handleVerify = () => {
    verify.mutate(
      {
        bank_code: draft.bankCode,
        account_number: draft.accountNumber,
        holder_name: draft.holderName,
      },
      {
        onSuccess: (data) => {
          setExpiresAt(data.expires_at);
          setOtpCode('');
        },
      }
    );
  };

  const handleConfirm = () => {
    if (otpCode.length !== 4) return;
    confirm.mutate({
      bank_code: draft.bankCode,
      account_number: draft.accountNumber,
      code: otpCode,
    });
  };

  const handleRegister = () => {
    if (!isConfirmed) return;
    register.mutate(
      {
        bank_code: draft.bankCode,
        account_number: draft.accountNumber,
        holder_name: draft.holderName,
      },
      {
        onSuccess: (acc) => {
          const view: RegisteredAccountView = {
            bankName: acc.bank_name,
            accountNumberMasked: acc.account_number_masked,
            holderName: draft.holderName,
          };
          navigate('/charge/account-registered', { state: view });
        },
      }
    );
  };

  const steps: AuthStep[] = [
    {
      index: 1,
      label: t('charge.autoDebit.stepRequest'),
      done: isPending || isConfirmed || verify.isPending,
    },
    { index: 2, label: t('charge.autoDebit.stepConfirm'), done: isConfirmed },
    { index: 3, label: t('charge.autoDebit.stepDone'), done: isConfirmed },
  ];

  const activeError = verify.error ?? confirm.error ?? register.error;

  return (
    <>
      <TopBar
        title={t('charge.autoDebit.title')}
        onBack={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
      />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>{t('charge.autoDebit.linkAuthTitle')}</div>
        <div className={styles.cardText}>
          {draft.bankName} · {t('charge.autoDebit.linkAuthText', { holderName: draft.holderName })}
        </div>
      </div>

      <div className={styles.steps}>
        {steps.map((step) => (
          <div key={step.index} className={styles.step}>
            <span className={`${styles.dot} ${step.done ? '' : styles.dotOff}`}>{step.index}</span>
            {step.label}
          </div>
        ))}
      </div>

      {/* 1단계: 1원 입금 요청 */}
      {!isPending && !isConfirmed && (
        <button
          type="button"
          className={styles.primary}
          disabled={verify.isPending || verify.isSuccess}
          onClick={handleVerify}
        >
          {verify.isPending ? t('charge.autoDebit.sending') : t('charge.autoDebit.sendVerify')}
        </button>
      )}

      {/* 2단계: 인증코드 입력 + 확인 */}
      {isPending && (
        <>
          <div className={`${styles.card} ${styles.cardInfo}`}>
            <div className={styles.cardText}>{t('charge.autoDebit.verificationSent')}</div>
          </div>

          <div className={styles.otpSection}>
            <div className={styles.otpLabel}>{t('charge.autoDebit.enterCode')}</div>
            <div className={styles.otpRow}>
              <input
                className={styles.otpInput}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder={t('charge.autoDebit.codePlaceholder')}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                autoFocus
                disabled={confirm.isPending}
              />
            </div>
            {expiresAt && (
              <div className={`${styles.expiryBadge}${countdown <= 60 ? ` ${styles.urgent}` : ''}`}>
                {t('charge.autoDebit.codeExpires', { time: formatCountdown(countdown) })}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.primary}
            disabled={otpCode.length !== 4 || confirm.isPending}
            onClick={handleConfirm}
          >
            {confirm.isPending
              ? t('charge.autoDebit.confirming')
              : t('charge.autoDebit.confirmCode')}
          </button>
        </>
      )}

      {activeError && <div className={styles.errorText}>{accountErrorMessage(activeError)}</div>}

      {alreadyRegistered ? (
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/mypage/accounts')}
        >
          {t('charge.autoDebit.viewAccounts')}
        </button>
      ) : (
        <button
          type="button"
          className={styles.ghost}
          disabled={!isConfirmed || register.isPending}
          onClick={handleRegister}
        >
          {register.isPending
            ? t('charge.autoDebit.registering')
            : t('charge.autoDebit.completeRegister')}
        </button>
      )}
    </>
  );
}
