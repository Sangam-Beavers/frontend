import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './AdditionalCertCompletePage.module.css';

export default function AdditionalCertCompletePage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="인증 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>추가 인증이 완료되었습니다</div>
        <div className={styles.cardText}>프로필에 인증 배지가 표시됩니다.</div>
      </div>

      <button type="button" className={styles.primaryBtn} onClick={() => navigate('/mypage')}>
        마이페이지로 돌아가기
      </button>
    </>
  );
}
