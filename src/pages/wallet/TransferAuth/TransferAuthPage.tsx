import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferAuthPage.module.css';

interface AuthState {
  recipientName: string;
  currency: string;
  amount: string;
}

const FALLBACK: AuthState = {
  recipientName: 'Linh',
  currency: 'VND',
  amount: '₫1,200,000',
};

export default function TransferAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as AuthState) ?? FALLBACK;
  const [password, setPassword] = useState('');

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="비밀번호 확인" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>송금 전 이중 인증</div>
          <div className={styles.cardText}>
            안전한 거래를 위해 계정 비밀번호를 한 번 더 입력해주세요.
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="auth-password">
            비밀번호
          </label>
          <input
            id="auth-password"
            type="password"
            className={styles.input}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className={styles.card}>
          <div className={styles.row}>
            <span>받는 사람</span>
            <b>{state.recipientName}</b>
          </div>
          <div className={styles.row}>
            <span>송금 금액</span>
            <b>
              {state.currency} {state.amount}
            </b>
          </div>
        </div>
      </div>

      <div className={styles.fixedBtn}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={password.length < 6}
          onClick={() =>
            navigate('/transfer/complete', {
              state: {
                recipientName: state.recipientName,
                currency: state.currency,
                amount: state.amount,
              },
            })
          }
        >
          인증 후 송금하기
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
          이전으로 돌아가기
        </button>
      </div>
    </>
  );
}
