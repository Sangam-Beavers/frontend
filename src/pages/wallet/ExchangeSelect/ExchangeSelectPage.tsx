import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { useSupportedCurrencies } from '@/hooks/useSupportedCurrencies';
import styles from './ExchangeSelectPage.module.css';

export default function ExchangeSelectPage() {
  const navigate = useNavigate();
  const { data } = useSupportedCurrencies();

  // 외화 = KRW 제외한 모든 지원 통화. API 응답 전이거나 실패 시엔 빈 라벨로 두지 않고 보수적인
  // fallback("USD / PHP / VND")을 보여준다 — Select는 안내성 화면이라 라벨 누락은 UX 손해.
  const foreignCodes =
    data?.currencies
      .filter((c) => c.currency_code !== 'KRW')
      .map((c) => c.currency_code)
      .join(' / ') ?? 'USD / PHP / VND';

  return (
    <>
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
            <div className={styles.itemMeta}>원화 KRW → 외화 {foreignCodes}</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/exchange/reverse')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>재환전</div>
            <div className={styles.itemMeta}>외화 {foreignCodes} → 원화 KRW</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
      </div>

      {/* 보유 통화 카드는 잔액 API(다른 담당) 연동 전이라 표시 보류.
          TODO: getBalance 머지 후 실제 잔액으로 교체. */}
    </>
  );
}
