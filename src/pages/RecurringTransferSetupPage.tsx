import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import styles from './RecurringTransferSetupPage.module.css';

export default function RecurringTransferSetupPage() {
  const navigate = useNavigate();
  const [recipient, setRecipient] = useState<string>('Linh · 앱 사용자');
  const [amount, setAmount] = useState<string>('VND ₫1,200,000');
  const [schedule, setSchedule] = useState<string>('매월 25일 오전 9시');
  const [startDate, setStartDate] = useState<string>('2026.06.25');
  const [endCondition, setEndCondition] = useState<string>('해지 전까지 반복');

  const handleSubmit = () => {
    navigate('/recurring/complete');
  };

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={0} />}>
      <TopBar title="정기 송금 설정" />

      <div className={styles.field}>
        <label htmlFor="recipient">송금 대상</label>
        <button
          id="recipient"
          type="button"
          className={styles.select}
          onClick={() => setRecipient(recipient)}
        >
          <span>{recipient}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="amount">송금 통화 / 금액</label>
        <input
          id="amount"
          type="text"
          className={styles.input}
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="schedule">송금 일정</label>
        <button
          id="schedule"
          type="button"
          className={styles.select}
          onClick={() => setSchedule(schedule)}
        >
          <span>{schedule}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>

      <div className={styles.field}>
        <label htmlFor="start-date">시작일</label>
        <input
          id="start-date"
          type="text"
          className={styles.input}
          value={startDate}
          onChange={(event) => setStartDate(event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="end-condition">종료 조건</label>
        <button
          id="end-condition"
          type="button"
          className={styles.select}
          onClick={() => setEndCondition(endCondition)}
        >
          <span>{endCondition}</span>
          <span aria-hidden>▾</span>
        </button>
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>정기 송금 안내</div>
        <div className={styles.cardText}>
          송금일 전 알림이 발송되며, 잔액 부족 시 송금이 실패할 수 있습니다.
        </div>
      </div>

      <div className={styles.primaryFixed}>
        <button type="button" className={styles.primary} onClick={handleSubmit}>
          정기 송금 설정하기
        </button>
      </div>
    </MobileScreen>
  );
}
