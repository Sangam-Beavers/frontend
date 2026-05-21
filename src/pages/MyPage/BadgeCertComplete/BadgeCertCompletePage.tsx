import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './BadgeCertCompletePage.module.css';

export default function BadgeCertCompletePage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="인증 완료" showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>배지 인증이 완료되었습니다</div>
        <div className={styles.cardText}>커뮤니티에서 배지를 확인할 수 있습니다.</div>
      </div>

      <button type="button" className={styles.primaryBtn} onClick={() => navigate('/mypage')}>
        마이페이지로 돌아가기
      </button>
    </>
  );
}
