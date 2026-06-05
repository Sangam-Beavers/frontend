import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import type { AccountRegisterDraft } from '@/types/charge';
import styles from './AccountRegisteredPage.module.css';

/** 계좌번호 마스킹 — 앞 3 + 끝 2만 노출(백엔드 account_number_masked와 동일 규칙). */
function maskAccountNumber(num: string): string {
  if (num.length <= 5) return num;
  return `${num.slice(0, 3)}${'*'.repeat(num.length - 5)}${num.slice(-2)}`;
}

export default function AccountRegisteredPage() {
  const navigate = useNavigate();
  // AddAccount → AutoDebitAuth를 거쳐 전달된 입력값. 새로고침·직접 진입 시엔 없음(null).
  const { state } = useLocation();
  const draft = state as AccountRegisterDraft | null;

  return (
    <>
      <TopBar title="계좌 등록 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>계좌가 등록되었습니다</div>
        {draft ? (
          <>
            <div className={styles.cardText}>
              {draft.bankName} · {maskAccountNumber(draft.accountNumber)}
            </div>
            {draft.holderName && <div className={styles.cardText}>예금주 {draft.holderName}</div>}
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
