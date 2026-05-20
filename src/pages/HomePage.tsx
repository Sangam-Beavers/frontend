import BottomNav from '@/components/BottomNav';
import type { CurrencyChip, ExchangeRate, NotificationCard } from '@/types/home';
import styles from './HomePage.module.css';

const CURRENCIES: CurrencyChip[] = [
  { code: 'USD', displayAmount: 'USD $240.50' },
  { code: 'VND', displayAmount: 'VND ₫1,200,000' },
];

const EXCHANGE_RATES: ExchangeRate[] = [
  { country: '미국', code: 'USD', rate: '1,370', change: '▲ 0.4%', isUp: true },
  { country: '베트남', code: 'VND', rate: '0.054', change: '▼ 0.1%', isUp: false },
  { country: '태국', code: 'THB', rate: '37.2', change: '▲ 0.2%', isUp: true },
];

const NOTIFICATIONS: NotificationCard[] = [
  { id: 'fraud', title: '이상거래 탐지', description: '현재 전자지갑은 안전합니다.' },
  { id: 'legal', title: '변호사 상담', description: '근로계약서 확인 상담을 받아보세요.' },
];

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <header className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.logoBox} />
            Global Bridge
          </div>
          <div className={styles.headerActions}>
            <button className={styles.langBtn}>🌐 KO ▾</button>
            <button className={styles.iconBtn}>🔔</button>
            <button className={styles.iconBtn}>👤</button>
          </div>
        </header>

        <div className={styles.wallet}>
          <div className={styles.walletRow}>
            <span>전자지갑</span>
            <span>메인 통화 KRW · 변경</span>
          </div>
          <div className={styles.amount}>₩1,250,000</div>
          <div className={styles.walletRow}>
            <span>선택 표시 통화 2개</span>
            <span>설정</span>
          </div>
          <div className={styles.currencyGrid}>
            {CURRENCIES.map((currency) => (
              <div key={currency.code} className={styles.currencyChip}>
                {currency.displayAmount}
              </div>
            ))}
          </div>
          <div className={styles.walletActions}>
            <button className={styles.walletBtn}>가져오기</button>
            <button className={styles.walletBtn}>보내기</button>
            <button className={styles.walletBtn}>환전하기</button>
          </div>
          <p className={styles.walletFooter}>Global Bridge 전자지갑</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>지금 나의 원화</div>
          <div className={styles.cardText}>모든 통화를 현재 환율로 바꾸면</div>
          <div className={styles.totalAmount}>₩1,820,000</div>
        </div>

        <div className={styles.section}>
          실시간 환율
          <span className={styles.pill}>전체보기</span>
        </div>
        <div className={styles.scrollRow}>
          {EXCHANGE_RATES.map((rate) => (
            <div key={rate.code} className={styles.rateCard}>
              <span className={styles.rateLabel}>
                {rate.country} {rate.code}
              </span>
              <b className={styles.rateValue}>{rate.rate}</b>
              <span
                className={`${styles.rateChange} ${rate.isUp ? styles.rateUp : styles.rateDown}`}
              >
                {rate.change}
              </span>
            </div>
          ))}
        </div>

        <div className={styles.section}>알림</div>
        <div className={styles.scrollRow}>
          {NOTIFICATIONS.map((notif) => (
            <div key={notif.id} className={`${styles.card} ${styles.notifCard}`}>
              <div className={styles.cardTitle}>{notif.title}</div>
              <div className={styles.cardText}>{notif.description}</div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeIndex={0} />
    </div>
  );
}
