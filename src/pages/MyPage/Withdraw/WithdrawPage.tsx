import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast, { type ToastVariant } from '@/components/common/Toast';
import { startLogout } from '@/auth/logout';
import { ApiException } from '@/api/client';
import { ROUTES } from '@/constants/routes';
import { useWithdraw } from '@/hooks/useWithdraw';
import { useMyProfile } from '@/hooks/useMyProfile';
import styles from './WithdrawPage.module.css';

type Step = 'reason' | 'info';

/** 탈퇴 사유 옵션 키 — 카카오페이/Toss 패턴. 마지막 'etc'은 자유 입력. */
const REASON_KEYS = [
  'rarelyUsed',
  'useOther',
  'missingFeatures',
  'frequentErrors',
  'privacyConcern',
  'etc',
] as const;

/**
 * 회원 탈퇴 화면 (다단계 흐름 — Toss/카카오페이 패턴).
 *
 * <p>1단계 (reason): 탈퇴 사유 선택 + 자유 입력(선택). 사유 자체는 백엔드로 전송하지 않음
 *     (현재 API 스펙엔 사유 필드 없음). 사용자에게 한 번 더 의사 확인 + 미래 통계용 로컬 로깅 자리.
 * <p>2단계 (info): 잃게 되는 데이터 안내 + 최종 ConfirmDialog 트리거.
 * <p>최종 확인 (ConfirmDialog): 실제 DELETE /members/me 호출. 성공 시 startLogout()으로
 *     로컬 토큰 정리 + IdP 세션 종료 + /login redirect.
 *
 * <p>실패 처리: 500 COMMON5000(IdP 연동 실패, 로컬 무변경) → 재시도 안내 토스트.
 * 401 AUTH4011은 apiClient interceptor가 자동 처리(이미 만료 → /login).
 *
 * <p>이슈 #153 — 모든 텍스트 i18n 키화.
 */
export default function WithdrawPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { data: profile } = useMyProfile();
  const withdraw = useWithdraw();

  const [step, setStep] = useState<Step>('reason');
  const [reasonKey, setReasonKey] = useState<(typeof REASON_KEYS)[number] | null>(null);
  const [reasonEtc, setReasonEtc] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null);
  const showToast = (msg: string, variant: ToastVariant = 'success') => setToast({ msg, variant });

  const canProceedFromReason = !!reasonKey && (reasonKey !== 'etc' || reasonEtc.trim().length > 0);

  const handleConfirmWithdraw = () => {
    withdraw.mutate(undefined, {
      onSuccess: () => {
        // 토큰 정리 + IdP end_session → /login redirect (location.href 이동이라 setState 후속 X)
        startLogout();
      },
      onError: (e) => {
        const code = e instanceof ApiException ? e.code : null;
        const msg =
          code === 'COMMON5000'
            ? t('withdraw.errorIdpFail')
            : code === 'MEMBER4001'
              ? t('withdraw.errorMemberNotFound')
              : t('withdraw.errorGeneric');
        showToast(msg, 'error');
        setConfirmOpen(false);
      },
    });
  };

  return (
    <>
      <TopBar
        title={t('withdraw.title')}
        onBack={() =>
          step === 'info' ? setStep('reason') : navigate(location.state?.from ?? ROUTES.MYPAGE)
        }
      />

      {step === 'reason' && (
        <div className={styles.section}>
          <h2 className={styles.heading}>{t('withdraw.step1Heading')}</h2>
          <p className={styles.subheading}>{t('withdraw.step1Sub')}</p>

          <div className={styles.reasonList}>
            {REASON_KEYS.map((key) => (
              <label
                key={key}
                className={`${styles.reasonItem} ${reasonKey === key ? styles.reasonItemSelected : ''}`}
              >
                <input
                  type="radio"
                  name="withdraw-reason"
                  value={key}
                  checked={reasonKey === key}
                  onChange={() => setReasonKey(key)}
                  className={styles.reasonRadio}
                />
                <span className={styles.reasonLabel}>{t(`withdraw.reasons.${key}`)}</span>
              </label>
            ))}
          </div>

          {reasonKey === 'etc' && (
            <textarea
              className={styles.etcInput}
              placeholder={t('withdraw.etcPlaceholder')}
              maxLength={200}
              value={reasonEtc}
              onChange={(e) => setReasonEtc(e.target.value)}
            />
          )}

          <div className={styles.fixedBtn}>
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={!canProceedFromReason}
              onClick={() => setStep('info')}
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {step === 'info' && (
        <div className={styles.section}>
          <h2 className={styles.heading}>
            {profile?.nickname
              ? t('withdraw.step2HeadingWithName', { nickname: profile.nickname })
              : t('withdraw.step2Heading')}
          </h2>
          <p className={styles.subheading}>{t('withdraw.step2Sub')}</p>

          <ul className={styles.lossList}>
            <li>
              <strong>{t('withdraw.lossWalletBalance')}</strong> —{' '}
              {t('withdraw.lossWalletBalanceDesc')}
            </li>
            <li>
              <strong>{t('withdraw.lossTransactions')}</strong> —{' '}
              {t('withdraw.lossTransactionsDesc')}
            </li>
            <li>
              <strong>{t('withdraw.lossCommunity')}</strong> — {t('withdraw.lossCommunityDesc')}
            </li>
            <li>
              <strong>{t('withdraw.lossBadge')}</strong> — {t('withdraw.lossBadgeDesc')}
            </li>
            <li>
              <strong>{t('withdraw.lossAccounts')}</strong> — {t('withdraw.lossAccountsDesc')}
            </li>
          </ul>

          <div className={styles.warningCard}>{t('withdraw.warning')}</div>

          <div className={styles.fixedBtn}>
            <div className={styles.btnRow}>
              <button
                type="button"
                className={styles.ghostBtn}
                onClick={() => setStep('reason')}
                disabled={withdraw.isPending}
              >
                {t('common.previous')}
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={() => setConfirmOpen(true)}
                disabled={withdraw.isPending}
              >
                {t('withdraw.submit')}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={t('withdraw.finalConfirmTitle')}
          message={t('withdraw.finalConfirmMessage')}
          confirmLabel={t('withdraw.finalConfirmLabel')}
          cancelLabel={t('common.cancel')}
          danger
          loading={withdraw.isPending}
          onConfirm={handleConfirmWithdraw}
          onCancel={() => {
            if (withdraw.isPending) return;
            setConfirmOpen(false);
          }}
        />
      )}

      <Toast message={toast?.msg ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
