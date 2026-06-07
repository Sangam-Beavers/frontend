import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
 */
export default function AccountManagePage() {
  const navigate = useNavigate();
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
        showToast('계좌가 해제되었습니다.', 'success');
      },
      onError: (e) => {
        // 다이얼로그를 닫지 않고 error prop으로 안에서 표시.
        showToast(accountErrorMessage(e), 'error');
      },
    });
  };

  const handleSetPrimary = (accountId: string) => {
    setPrimary.mutate(accountId, {
      onSuccess: () => showToast('주 계좌로 지정되었습니다.', 'success'),
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
      <TopBar title="계좌 관리" onBack={() => navigate(-1)} />

      {isLoading && <div className={styles.state}>계좌를 불러오는 중…</div>}
      {error && (
        <div className={styles.state}>계좌를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
      )}
      {!isLoading && !error && accounts.length === 0 && (
        <div className={styles.card}>
          <div className={styles.cardTitle}>계좌를 연동해주세요</div>
          <div className={styles.cardText}>
            전자지갑은 개설되었지만 아직 연동된 계좌가 없습니다. 계좌를 연동하면 충전·송금을 시작할
            수 있어요.
          </div>
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
                        <span className={styles.primaryBadge} aria-label="주 계좌">
                          ★ 주 계좌
                        </span>
                      )}
                    </div>
                    <div className={styles.itemMeta}>{acc.account_number_masked}</div>
                  </div>
                  <span className={styles.pill}>연결됨</span>
                </div>

                <div className={styles.itemActions}>
                  {!acc.is_primary && (
                    <button
                      type="button"
                      className={styles.actionGhost}
                      disabled={isPrimaryPending || setPrimary.isPending}
                      onClick={() => handleSetPrimary(acc.account_public_id)}
                    >
                      {isPrimaryPending ? '지정 중…' : '주 계좌로 지정'}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.actionDanger}
                    disabled={isDeletePending}
                    onClick={() => setConfirmId(acc.account_public_id)}
                  >
                    계좌 해제
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
        계좌 추가
      </button>

      {target && (
        <ConfirmDialog
          title="계좌 연결 해제"
          message={`${target.bank_name} ${target.account_number_masked} 계좌를 해제하시겠습니까? 주 계좌를 해제하면 남은 계좌 중 가장 최근 등록한 계좌가 자동으로 주 계좌가 됩니다.`}
          confirmLabel="해제"
          cancelLabel="취소"
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
