import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferConfirmPage.module.css';

interface TransferState {
  recipientName: string;
  recipientInitial: string;
  currency: string;
  amount: string;
  memo?: string;
}

const FALLBACK: TransferState = {
  recipientName: 'Linh',
  recipientInitial: 'L',
  currency: 'VND',
  amount: '₫1,200,000',
};

export default function TransferConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as TransferState) ?? FALLBACK;
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <TopBar title="송금 확인" onBack={() => navigate(-1)} />

      <div className={styles.card}>
        <div className={styles.recipientRow}>
          <div className={styles.avatar}>{state.recipientInitial}</div>
          <div className={styles.recipientInfo}>
            <div className={styles.recipientName}>
              {state.recipientName}
              <span className={styles.pill}>인증</span>
            </div>
            <div className={styles.recipientMeta}>앱 사용자에게 보내기</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.row}>
          <span>보낼 통화</span>
          <b>{state.currency}</b>
        </div>
        <div className={styles.row}>
          <span>보낼 금액</span>
          <b>{state.amount}</b>
        </div>
        <div className={styles.row}>
          <span>수수료</span>
          <b>없음</b>
        </div>
        <div className={styles.row}>
          <span>최종 차감</span>
          <b>{state.amount}</b>
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardOk}`}>
        <div className={styles.cardTitle}>이상거래 탐지 결과</div>
        <div className={styles.cardText}>안전한 거래로 확인되었습니다.</div>
      </div>

      <div className={styles.checkRow} onClick={() => setConfirmed((v) => !v)}>
        <span>송금 정보를 확인했습니다</span>
        <div className={`${styles.checkbox} ${confirmed ? styles.checkboxChecked : ''}`}>
          {confirmed && '✓'}
        </div>
      </div>

      <div className={styles.btnRow}>
        <button type="button" className={styles.secondaryBtn} onClick={() => navigate(-1)}>
          수정하기
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!confirmed}
          onClick={() =>
            navigate('/transfer/auth', {
              state: {
                recipientName: state.recipientName,
                recipientInitial: state.recipientInitial,
                currency: state.currency,
                amount: state.amount,
              },
            })
          }
        >
          송금하기
        </button>
      </div>
    </>
  );
}
