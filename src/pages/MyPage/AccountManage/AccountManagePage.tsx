import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

export default function AccountManagePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const target = accounts.find((a) => a.account_public_id === confirmId);

  const [toast, setToast] = useState<{ msg: string; variant: ToastVariant } | null>(null);
  const showToast = (msg: string, variant: ToastVariant = 'success') => setToast({ msg, variant });

  const deleteAccount = useDeleteAccount();
  const setPrimary = useSetPrimaryAccount();

  const handleConfirmDelete = () => {
    if (!confirmId) return;
    deleteAccount.mutate(confirmId, {
      onSuccess: () => {
        setConfirmId(null);
        showToast(t('account.releaseSuccess'), 'success');
      },
      onError: (e) => {
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

  const deleteDialogError =
    deleteAccount.isError && deleteAccount.variables === confirmId
      ? accountErrorMessage(deleteAccount.error)
      : undefined;

  return (
    <>
      <TopBar
        title={t('account.title')}
        onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.MYPAGE))}
      />

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
        onClick={() => navigate(ROUTES.CHARGE_ADD_ACCOUNT, { state: { from: '/mypage/accounts' } })}
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
