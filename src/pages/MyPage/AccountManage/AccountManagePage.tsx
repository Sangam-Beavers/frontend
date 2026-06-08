import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Toast, { type ToastVariant } from '@/components/common/Toast';
import { ROUTES } from '@/constants/routes';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import { useDeleteAccount } from '@/hooks/useDeleteAccount';
import { useSetPrimaryAccount } from '@/hooks/useSetPrimaryAccount';
import { accountErrorMessage } from '@/utils/accountErrorMessage';
import styles from './AccountManagePage.module.css';

/**
 * 계좌 관리 화면.
 *
 * <p>실 API 연동: 목록 조회({@link useMyAccounts}) + 주 계좌 변경({@link useSetPrimaryAccount})
 * + 계좌 삭제({@link useDeleteAccount}). 백엔드는 wallet-service AccountController.
 *
 * <p>UX (카카오페이/Toss 패턴):
 * <ul>
 *   <li>계좌 카드: 은행명·마스킹 계좌번호. 주 계좌엔 별 배지.</li>
 *   <li>각 카드 아래에 두 액션: "주 계좌로 지정"(주 계좌일 땐 hidden) / "계좌 해제".</li>
 *   <li>해제는 위험 동작 — {@link ConfirmDialog} 한 번 거친다.</li>
 *   <li>성공/에러는 {@link Toast}로 짧게 알림. 에러 메시지는 {@link accountErrorMessage}로 매핑.</li>
 * </ul>
 *
 * <p>이슈 #108 — 계좌가 0건이면 단순 "등록된 계좌 없음" 대신 "계좌를 연동해주세요" 안내 카드 + 계좌 추가 CTA.
 * 전자지갑 1계정 1개 보장(BE #152)은 백엔드에서 처리하므로 프론트는 계좌 유무만 분기.
 *
 * <p>이슈 #153 — 모든 텍스트 i18n 키화.
 */
export default function AccountManagePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  // 해제 확인 대상은 account_public_id로 식별 (목록이 갱신돼도 인덱스보다 안전).
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const target = accounts.find((a) => a.account_public_id === confirmId);

  // 토스트 상태 — 성공/에러 피드백.
  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null);
  const showToast = (msg: string, variant: ToastVariant = 'success') => setToast({ msg, variant });

  const deleteAccount = useDeleteAccount();
  const setPrimary = useSetPrimaryAccount();

  // ─── 액션 핸들러 ───────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!confirmId) return;
    deleteAccount.mutate(confirmId, {
      onSuccess: () => {
        setConfirmId(null);
        showToast(t('account.releaseSuccess'), 'success');
      },
      onError: (e) => {
        // 다이얼로그를 닫지 않고 error prop으로 안에서 표시.
        showToast(accountErrorMessage(e), 'error');
      },
    });
  };

  const handleSetPrimary = (accountId: string) => {
    setPrimary.mutate(accountId, {
      onSuccess: () => showToast(t('account.setPrimarySuccess'), 'success'),
      onError: (e) => showToast(accountErrorMessage(e), 'error'),
    });
  };

  // 다이얼로그 에러는 ConfirmDialog 안에서 표시할 텍스트 — 진행 중인 시도가 실패한 경우만.
  const deleteDialogError =
    deleteAccount.isError && deleteAccount.variables === confirmId
      ? accountErrorMessage(deleteAccount.error)
      : undefined;

  return (
    <>
      <TopBar title={t('account.title')} onBack={() => navigate(-1)} />

      {isLoading && <div className={styles.state}>{t('account.loading')}</div>}
      {error && <div className={styles.state}>{t('account.loadError')}</div>}
      {!isLoading && !error && accounts.length === 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>{t('account.emptyTitle')}</div>
          <div className={styles.cardText}>{t('account.emptyBody')}</div>
        </div>
      )}

      {accounts.length > 0 && (
        <div className={styles.list}>
          {accounts.map((acc) => {
            const isPrimaryPending =
              setPrimary.isPending && setPrimary.variables === acc.account_public_id;
            const isDeletePending =
              deleteAccount.isPending && deleteAccount.variables === acc.account_public_id;

            return (
              <div key={acc.account_public_id} className={styles.item}>
                <div className={styles.itemHeader}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemTitle}>
                      {acc.bank_name}
                      {acc.is_primary && (
                        <span className={styles.primaryBadge} aria-label={t('account.primary')}>
                          {t('account.primaryBadge')}
                        </span>
                      )}
                    </div>
                    <div className={styles.itemMeta}>{acc.account_number_masked}</div>
                  </div>
                  <span className={styles.pill}>{t('account.connected')}</span>
                </div>

                <div className={styles.itemActions}>
                  {!acc.is_primary && (
                    <button
                      type="button"
                      className={styles.actionGhost}
                      disabled={isPrimaryPending || setPrimary.isPending}
                      onClick={() => handleSetPrimary(acc.account_public_id)}
                    >
                      {isPrimaryPending ? t('account.setPrimaryPending') : t('account.setPrimary')}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.actionDanger}
                    disabled={isDeletePending}
                    onClick={() => setConfirmId(acc.account_public_id)}
                  >
                    {t('account.release')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT)}
      >
        {t('account.addAccount')}
      </button>

      {target && (
        <ConfirmDialog
          title={t('account.releaseConfirmTitle')}
          message={t('account.releaseConfirmMessage', {
            bank: target.bank_name,
            number: target.account_number_masked,
          })}
          confirmLabel={t('account.releaseConfirmLabel')}
          cancelLabel={t('common.cancel')}
          danger
          loading={deleteAccount.isPending}
          error={deleteDialogError}
          onConfirm={handleConfirmDelete}
          onCancel={() => {
            if (deleteAccount.isPending) return;
            setConfirmId(null);
            deleteAccount.reset(); // 다음에 열 때 이전 에러 표시 안 되도록
          }}
        />
      )}

      <Toast message={toast?.msg ?? null} variant={toast?.variant} onClose={() => setToast(null)} />
    </>
  );
}
