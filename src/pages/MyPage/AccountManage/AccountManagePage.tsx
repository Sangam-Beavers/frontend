import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { MANAGE_ACCOUNTS_MOCK } from '@/mocks/chargeMock';
import styles from './AccountManagePage.module.css';

const INITIAL_ACCOUNTS = MANAGE_ACCOUNTS_MOCK.result;

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

      <button
        type="button"
        className={styles.primaryBtn}
        onClick={() => navigate('/charge/add-account')}
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
