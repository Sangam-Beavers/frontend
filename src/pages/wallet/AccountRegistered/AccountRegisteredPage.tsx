import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './AccountRegisteredPage.module.css';

export default function AccountRegisteredPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="계좌 등록 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>계좌가 등록되었습니다</div>
        <div className={styles.cardText}>국민은행 · 123-****-7890</div>
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
