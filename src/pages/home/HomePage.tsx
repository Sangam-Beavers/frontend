import { useNavigate } from 'react-router-dom';
import {
  HOME_CURRENCIES_MOCK,
  HOME_EXCHANGE_RATES_MOCK,
  HOME_NOTIFICATIONS_MOCK,
} from '@/mocks/homeMock';
import styles from './HomePage.module.css';

const CURRENCIES = HOME_CURRENCIES_MOCK.result;
const EXCHANGE_RATES = HOME_EXCHANGE_RATES_MOCK.result;
const NOTIFICATIONS = HOME_NOTIFICATIONS_MOCK.result;

export default function HomePage() {
  const navigate = useNavigate();
  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoBox} />
          Global Bridge
        </div>
        <div className={styles.headerActions}>
          <button className={styles.langBtn} onClick={() => navigate('/mypage/language')}>
            🌐 KO ▾
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/mypage/notifications')}>
            🔔
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/mypage')}>
            👤
          </button>
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
          <button className={styles.walletBtn} onClick={() => navigate('/charge')}>
            가져오기
          </button>
          <button className={styles.walletBtn} onClick={() => navigate('/transfer')}>
            보내기
          </button>
          <button className={styles.walletBtn} onClick={() => navigate('/exchange')}>
            환전하기
          </button>
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
        <span
          className={styles.pill}
          onClick={() => navigate('/exchange')}
          style={{ cursor: 'pointer' }}
        >
          전체보기
        </span>
      </div>
      <div className={styles.scrollRow}>
        {EXCHANGE_RATES.map((rate) => (
          <div
            key={rate.code}
            className={styles.rateCard}
            onClick={() => navigate('/exchange/form')}
            style={{ cursor: 'pointer' }}
          >
            <span className={styles.rateLabel}>
              {rate.country} {rate.code}
            </span>
            <b className={styles.rateValue}>{rate.rate}</b>
            <span className={`${styles.rateChange} ${rate.isUp ? styles.rateUp : styles.rateDown}`}>
              {rate.change}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.section}>알림</div>
      <div className={styles.scrollRow}>
        {NOTIFICATIONS.map((notif) => (
          <div
            key={notif.id}
            className={`${styles.card} ${styles.notifCard}`}
            onClick={() =>
              navigate(notif.id === 'legal' ? '/doc-analysis' : '/mypage/wallet-history')
            }
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.cardTitle}>{notif.title}</div>
            <div className={styles.cardText}>{notif.description}</div>
          </div>
        ))}
      </div>
    </>
  );
}
