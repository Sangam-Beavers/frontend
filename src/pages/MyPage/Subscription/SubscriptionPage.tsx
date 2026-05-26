import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './SubscriptionPage.module.css';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const [cancelled, setCancelled] = useState(false);

  return (
    <>
      <TopBar title="구독 관리" onBack={() => navigate(-1)} />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>
          구독 상태: {cancelled ? '미구독' : '프리미엄 구독중'}
        </div>
        <div className={styles.cardText}>
          {cancelled
            ? '월 15,000원 구독 시 문서 분석 서비스를 최대 10문서까지 이용할 수 있습니다.'
            : '문서 분석 서비스를 최대 10문서까지 이용하실 수 있습니다.'}
        </div>
      </div>

      {cancelled && (
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => navigate('/doc-analysis/payment')}
        >
          구독하기
        </button>
      )}

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
    </>
  );
}
