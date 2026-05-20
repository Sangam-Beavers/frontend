import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopBar from '../components/TopBar';
import styles from './ExchangeCompletePage.module.css';

interface CompleteState {
  fromLabel: string;
  toLabel: string;
  rateLabel: string;
  fee: string;
}

export default function ExchangeCompletePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as CompleteState | null;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="환전 완료" showBack={false} />

        <div className={styles.checkOnly}>✓</div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>환전이 완료되었습니다</div>
          <div className={styles.cardText}>
            {state ? (
              <>
                {state.fromLabel} → {state.toLabel}
                <br />
                적용 환율 {state.rateLabel} · 수수료 {state.fee}
              </>
            ) : (
              '환전이 정상적으로 처리되었습니다.'
            )}
          </div>
        </div>

        <button className={styles.primaryBtn} onClick={() => navigate('/wallet')}>
          전자지갑으로 돌아가기
        </button>
        <button className={styles.ghostBtn} onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </div>

      <BottomNav activeIndex={0} />
    </div>
  );
}
