import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferCompletePage.module.css';

interface CompleteState {
  recipientName: string;
  currency: string;
  amount: string;
}

const FALLBACK: CompleteState = {
  recipientName: 'Linh',
  currency: 'VND',
  amount: '₫1,200,000',
};

const STAMPS = [true, true, true, false, false];

export default function TransferCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as CompleteState) ?? FALLBACK;

  return (
    <>
      <TopBar title="송금 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>송금이 완료되었습니다</div>
        <div className={styles.cardText}>
          <span className={styles.highlight}>{state.recipientName}</span>에게 {state.currency}{' '}
          {state.amount}
          <br />
          수수료 없음 · 처리 완료 82ms
        </div>
      </div>

      <div className={styles.couponCard}>
        <div className={styles.couponTitle}>송금 쿠폰 적립</div>
        <div className={styles.couponDesc}>송금 1건 완료로 도장 1개가 적립되었어요.</div>
        <div className={styles.stampRow}>
          {STAMPS.map((filled, i) => (
            <div key={i} className={`${styles.stamp} ${filled ? styles.stampFilled : ''}`}>
              {filled ? '✓' : ''}
            </div>
          ))}
        </div>
        <div className={styles.couponNote}>쿠폰 5장 모으면 송금 수수료 1회 면제</div>
      </div>

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => navigate('/mypage/wallet-history')}
        >
          전자지갑 내역 보기
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() =>
            navigate('/transfer/receipt', {
              state: {
                recipient: state.recipientName,
                currency: state.currency,
                amount: state.amount,
              },
            })
          }
        >
          송금 확인증 출력
        </button>
      </div>
    </>
  );
}
