import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ApiException } from '@/api';
import { useVerifyAccount } from '@/hooks/useVerifyAccount';
import { useRegisterAccount } from '@/hooks/useRegisterAccount';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import type { AuthStep, AccountRegisterDraft, RegisteredAccountView } from '@/types/charge';
import styles from './AutoDebitAuthPage.module.css';

export default function AutoDebitAuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state } = useLocation();
  const draft = state as AccountRegisterDraft | null;

  const verify = useVerifyAccount();
  const register = useRegisterAccount();
  const accountToken = verify.data?.account_token ?? '';
  const verified = accountToken !== '';
  // 이미 등록된 계좌(409) — 재시도 대신 계좌 목록으로 유도한다.
  const alreadyRegistered =
    register.error instanceof ApiException && register.error.code === 'ACCOUNT4004';

  // 계좌 정보 없이 직접 진입(새로고침 등) — 진행 불가, 계좌 추가로 유도.
  if (!draft) {
    return (
      <>
        <TopBar title={t('charge.autoDebit.title')} />
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
    verify.mutate({
      bank_code: draft.bankCode,
      account_number: draft.accountNumber,
      holder_name: draft.holderName,
    });
  };

  const handleRegister = () => {
    if (!verified) return;
    register.mutate(
      {
        bank_code: draft.bankCode,
        account_number: draft.accountNumber,
        account_token: accountToken,
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
    { index: 1, label: t('charge.autoDebit.stepRequest'), done: verified || verify.isPending },
    { index: 2, label: t('charge.autoDebit.stepConfirm'), done: verified },
    { index: 3, label: t('charge.autoDebit.stepDone'), done: verified },
  ];

  return (
    <>
      <TopBar title={t('charge.autoDebit.title')} />

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

      {(verify.error || register.error) && (
        <div className={styles.errorText}>
          {accountErrorMessage(verify.error || register.error)}
        </div>
      )}

      {alreadyRegistered ? (
        <button
          type="button"
          className={styles.primary}
          onClick={() => navigate('/mypage/accounts')}
        >
          {t('charge.autoDebit.viewAccounts')}
        </button>
      ) : (
        <>
          <button
            type="button"
            className={styles.primary}
            disabled={verify.isPending || verified}
            onClick={handleVerify}
          >
            {verify.isPending
              ? t('charge.autoDebit.verifying')
              : verified
                ? t('charge.autoDebit.verified')
                : t('charge.autoDebit.requestVerify')}
          </button>
          <button
            type="button"
            className={styles.ghost}
            disabled={!verified || register.isPending}
            onClick={handleRegister}
          >
            {register.isPending
              ? t('charge.autoDebit.registering')
              : t('charge.autoDebit.completeRegister')}
          </button>
        </>
      )}
    </>
  );
}
