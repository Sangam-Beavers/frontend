import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './AddAccountPage.module.css';

const BANKS = [
  '국민은행',
  '신한은행',
  '하나은행',
  '우리은행',
  '농협은행',
  '카카오뱅크',
  '기업은행',
  '케이뱅크',
  'SC제일은행',
  '씨티은행',
];

export default function AddAccountPage() {
  const navigate = useNavigate();
  const [bankName, setBankName] = useState<string>('국민은행');
  const [accountNumber, setAccountNumber] = useState<string>('1234567890');
  const [accountHolder, setAccountHolder] = useState<string>('김소영');

  const handleNext = () => {
    navigate('/charge/auto-debit');
  };

  return (
    <>
      <TopBar title="계좌 추가" />

      <div className={styles.field}>
        <label htmlFor="bank-name">은행명</label>
        <select
          id="bank-name"
          className={styles.select}
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        >
          {BANKS.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
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
        <input
          id="account-holder"
          type="text"
          className={styles.input}
          value={accountHolder}
          onChange={(event) => setAccountHolder(event.target.value)}
        />
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
    </>
  );
}
