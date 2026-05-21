import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferSelectPage.module.css';

export default function TransferSelectPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="보내기" />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>보낼 수 있는 전자지갑 잔액</div>
        <div className={styles.cardText}>KRW ₩1,250,000 · USD $240.50 · VND ₫1,200,000</div>
      </div>

      <div className={styles.list}>
        <div className={styles.item} onClick={() => navigate('/transfer/app')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>앱 사용자에게 보내기</div>
            <div className={styles.itemMeta}>이메일 또는 아이디로 전송</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/transfer/bank')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>타행계좌로 보내기</div>
            <div className={styles.itemMeta}>은행 계좌번호로 외부 계좌 송금</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/recurring')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>정기 송금 설정</div>
            <div className={styles.itemMeta}>대상, 금액, 일정을 지정해 반복 송금</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
      </div>
    </>
  );
}
