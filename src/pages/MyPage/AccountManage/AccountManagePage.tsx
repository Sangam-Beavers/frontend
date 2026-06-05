import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { MANAGE_ACCOUNTS_MOCK } from '@/mocks/chargeMock';
import styles from './AccountManagePage.module.css';

const INITIAL_ACCOUNTS = MANAGE_ACCOUNTS_MOCK.result;

/**
 * 계좌 관리 화면. 이슈 #108 — 계좌가 0건일 때 "계좌를 연동해주세요" 안내를 우선 노출한다.
 * 전자지갑 1계정 1개 보장(BE #152)은 백엔드에서 처리하므로 프론트는 계좌 유무만 분기한다.
 */
export default function AccountManagePage() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  const handleDisconnect = () => {
    if (confirmIndex === null) return;
    setAccounts((prev) => prev.filter((_, i) => i !== confirmIndex));
    setConfirmIndex(null);
  };

  return (
    <>
      <TopBar title="계좌 관리" onBack={() => navigate(-1)} />

      {accounts.length === 0 ? (
        <div className={`${styles.card}`}>
          <div className={styles.cardTitle}>계좌를 연동해주세요</div>
          <div className={styles.cardText}>
            전자지갑은 개설되었지만 아직 연동된 계좌가 없습니다. 계좌를 연동하면 충전·송금을 시작할
            수 있어요.
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {accounts.map((acc, i) => (
            <div key={i} className={styles.item} onClick={() => setConfirmIndex(i)}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{acc.bank}</div>
                <div className={styles.itemMeta}>
                  {acc.number}
                  {acc.isPrimary && ' · 주 계좌'}
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

      {confirmIndex !== null && (
        <div className={`${styles.card} ${styles.cardDanger}`}>
          <div className={styles.cardTitle}>계좌 연결 해제 확인</div>
          <div className={styles.cardText}>
            {accounts[confirmIndex]?.bank} {accounts[confirmIndex]?.number} 계좌를 해제하시겠습니까?
          </div>
          <div className={styles.btnRow}>
            <button type="button" className={styles.ghostBtn} onClick={() => setConfirmIndex(null)}>
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
