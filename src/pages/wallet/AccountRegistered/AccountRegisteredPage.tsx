import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import type { RegisteredAccountView } from '@/types/charge';
import styles from './AccountRegisteredPage.module.css';

export default function AccountRegisteredPage() {
  const navigate = useNavigate();
  // register 성공 시 AutoDebitAuth가 넘긴 "서버 확정" 계좌. 새로고침·직접 진입 시엔 null.
  const { state } = useLocation();
  const acc = state as RegisteredAccountView | null;

  return (
    <>
      <TopBar title="계좌 등록 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>계좌가 등록되었습니다</div>
        {acc ? (
          <>
            <div className={styles.cardText}>
              {acc.bankName} · {acc.accountNumberMasked}
            </div>
            {acc.holderName && <div className={styles.cardText}>예금주 {acc.holderName}</div>}
          </>
        ) : (
          <div className={styles.cardText}>계좌가 정상적으로 등록되었어요.</div>
        )}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/charge')}>
        가져오기 계속하기
      </button>
      <button type="button" className={styles.ghost} onClick={() => navigate('/')}>
        홈으로 돌아가기
      </button>
    </>
  );
}
