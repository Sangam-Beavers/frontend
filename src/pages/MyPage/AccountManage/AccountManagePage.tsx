import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useMyAccounts } from '@/hooks/useMyAccounts';
import type { AccountListResponse } from '@/api/wallet';
import styles from './AccountManagePage.module.css';

/**
 * 계좌 관리 화면.
 *
 * <p>실 API 연동(#102) 후 {@link useMyAccounts}로 서버 목록 표시. 이슈 #108 — 계좌가 0건이면
 * 단순 "등록된 계좌 없음" 대신 "계좌를 연동해주세요" 안내 카드 + 계좌 추가 CTA로 유도한다.
 * 전자지갑 1계정 1개 보장(BE #152)은 백엔드에서 처리하므로 프론트는 계좌 유무만 분기한다.
 */
export default function AccountManagePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useMyAccounts();
  const accounts = data?.accounts ?? [];

  // 해제 확인 대상은 account_public_id로 식별 (목록이 갱신돼도 인덱스보다 안전).
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const target = accounts.find((a) => a.account_public_id === confirmId);

  // TODO: DELETE /accounts/{id}(deleteAccount) 연동 시 useMutation으로 교체하고
  //   onSuccess에서 invalidateQueries(['wallet','accounts'])로 서버 기준 갱신할 것.
  //   현재는 캐시에서만 제거(미영속) — 새로고침하면 서버 목록으로 복원된다.
  const handleDisconnect = () => {
    if (!confirmId) return;
    queryClient.setQueryData<AccountListResponse>(['wallet', 'accounts'], (prev) =>
      prev ? { accounts: prev.accounts.filter((a) => a.account_public_id !== confirmId) } : prev
    );
    setConfirmId(null);
  };

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
          {accounts.map((acc) => (
            <div
              key={acc.account_public_id}
              className={styles.item}
              onClick={() => setConfirmId(acc.account_public_id)}
            >
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{acc.bank_name}</div>
                <div className={styles.itemMeta}>
                  {acc.account_number_masked}
                  {acc.is_primary && ' · 주 계좌'}
                </div>
              </div>
              <span className={styles.pill}>연결됨</span>
            </div>
          ))}
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
        <div className={`${styles.card} ${styles.cardDanger}`}>
          <div className={styles.cardTitle}>계좌 연결 해제 확인</div>
          <div className={styles.cardText}>
            {target.bank_name} {target.account_number_masked} 계좌를 해제하시겠습니까?
          </div>
          <div className={styles.btnRow}>
            <button type="button" className={styles.ghostBtn} onClick={() => setConfirmId(null)}>
              취소
            </button>
            <button type="button" className={styles.dangerBtn} onClick={handleDisconnect}>
              해제
            </button>
          </div>
        </div>
      )}
    </>
  );
}
