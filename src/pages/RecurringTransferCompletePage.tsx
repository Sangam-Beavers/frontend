import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import styles from './RecurringTransferCompletePage.module.css';

export default function RecurringTransferCompletePage() {
  const navigate = useNavigate();

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={0} />}>
      <TopBar title="정기 송금 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>정기 송금이 진행되었습니다</div>
        <div className={styles.cardText}>
          Linh에게 VND ₫1,200,000
          <br />
          매월 25일 정기 송금 · 처리 완료
        </div>
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring')}>
        정기 송금 내역 보기
      </button>
      <button type="button" className={styles.ghost} onClick={() => navigate('/')}>
        홈으로 돌아가기
      </button>
    </MobileScreen>
  );
}
