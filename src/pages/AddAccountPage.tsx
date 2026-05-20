import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import styles from './AddAccountPage.module.css';

export default function AddAccountPage() {
  const navigate = useNavigate();
  const [bankName, setBankName] = useState<string>('국민은행');
  const [accountNumber, setAccountNumber] = useState<string>('1234567890');
  const [accountHolder, setAccountHolder] = useState<string>('김소영');

  const handleNext = () => {
    navigate('/charge/auto-debit');
  };

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={0} />}>
      <TopBar title="계좌 추가" />

      <div className={styles.field}>
        <label htmlFor="bank-name">은행명</label>
        <button
          id="bank-name"
          type="button"
          className={styles.select}
          onClick={() => setBankName(bankName)}
        >
          <span>{bankName}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="account-number">계좌번호</label>
        <input
          id="account-number"
          type="text"
          className={styles.input}
          value={accountNumber}
          onChange={(event) => setAccountNumber(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="account-holder">예금주</label>
        <div className={styles.input}>
          <input
            id="account-holder"
            type="text"
            value={accountHolder}
            onChange={(event) => setAccountHolder(event.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'inherit',
              fontSize: 'inherit',
              fontFamily: 'inherit',
              padding: 0,
            }}
          />
          <b className={styles.confirm}>확인</b>
        </div>
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>자동이체 인증 필요</div>
        <div className={styles.cardText}>계좌 연결을 위해 자동이체 인증 화면으로 이동합니다.</div>
      </div>

      <div className={styles.primaryFixed}>
        <button type="button" className={styles.primary} onClick={handleNext}>
          다음
        </button>
      </div>
    </MobileScreen>
  );
}
