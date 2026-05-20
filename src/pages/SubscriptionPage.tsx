import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './SubscriptionPage.module.css';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [cancelled, setCancelled] = useState(false);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="구독 관리" onBack={() => navigate(-1)} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>
            구독 상태: {cancelled ? '미구독' : '프리미엄 구독중'}
          </div>
          <div className={styles.cardText}>
            월 15,000원 결제 후 문서 분석 서비스를 최대 10문서를 확인할 수 있습니다.
          </div>
        </div>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => navigate('/doc-analysis/payment')}
        >
          구독하기
        </button>

        {!cancelled && (
          <div className={styles.card}>
            <div className={styles.cardTitle}>현재 구독 현황</div>
            <div className={styles.row}>
              <span>결제 시작일</span>
              <span>2026.05.14</span>
            </div>
            <div className={styles.row}>
              <span>다음 결제일</span>
              <span>2026.06.14</span>
            </div>
            <button type="button" className={styles.dangerBtn} onClick={() => setCancelled(true)}>
              구독 취소
            </button>
          </div>
        )}
      </div>

      <BottomNav activeIndex={3} />
    </div>
  );
}
