import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopBar from '../components/TopBar';
import styles from './ExchangeSelectPage.module.css';

export default function ExchangeSelectPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="환전 선택" />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>원하는 환전 방식을 선택하세요</div>
          <div className={styles.cardText}>
            환전은 언제든지 가능하며, 결과는 전자지갑에 통화별로 보관됩니다.
          </div>
        </div>

        <div className={styles.list}>
          <div className={styles.item} onClick={() => navigate('/exchange/form')}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>환전</div>
              <div className={styles.itemMeta}>원화 KRW → 외화 USD / VND / THB / CNY</div>
            </div>
            <div className={styles.arrowIcon}>›</div>
          </div>
          <div className={styles.item} onClick={() => navigate('/exchange/reverse')}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>재환전</div>
              <div className={styles.itemMeta}>외화 USD / VND / THB / CNY → 원화 KRW</div>
            </div>
            <div className={styles.arrowIcon}>›</div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>보유 통화</div>
          <div className={styles.cardText}>KRW ₩1,250,000 · USD $240.50 · VND ₫1,200,000</div>
        </div>
      </div>

      <BottomNav activeIndex={0} />
    </div>
  );
}
