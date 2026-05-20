import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopBar from '../components/TopBar';
import styles from './ExchangeFormPage.module.css';

interface Currency {
  code: string;
  label: string;
  symbol: string;
}

interface RateInfo {
  rate: number;
  display: string;
}

const FOREIGN_CURRENCIES: Currency[] = [
  { code: 'USD', label: '달러', symbol: '$' },
  { code: 'VND', label: '동', symbol: '₫' },
  { code: 'THB', label: '바트', symbol: '฿' },
  { code: 'CNY', label: '위안', symbol: '¥' },
];

const RATES: Record<string, RateInfo> = {
  USD: { rate: 1 / 1380, display: '1 USD = ₩1,380' },
  VND: { rate: 1 / 18.5, display: '1 VND = ₩0.054' },
  THB: { rate: 1 / 38.5, display: '1 THB = ₩38.5' },
  CNY: { rate: 1 / 192, display: '1 CNY = ₩192' },
};

const FEE_KRW = 1000;

export default function ExchangeFormPage() {
  const navigate = useNavigate();
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');

  const num = parseFloat(amount) || 0;
  const rateInfo = RATES[toCurrency];
  const toSymbol = FOREIGN_CURRENCIES.find((c) => c.code === toCurrency)?.symbol ?? '';
  const received = num > 0 ? (num * rateInfo.rate - FEE_KRW * rateInfo.rate).toFixed(2) : null;

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="환전하기" onBack={() => navigate('/exchange')} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>원화 → 외화 환전</div>
          <div className={styles.cardText}>원화를 원하는 외화로 환전합니다.</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>보낼 통화</label>
          <div className={styles.inputReadonly}>KRW 원화</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="exch-amount">
            환전 금액
          </label>
          <input
            id="exch-amount"
            type="number"
            className={styles.input}
            placeholder="₩0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="exch-to">
            받을 통화
          </label>
          <select
            id="exch-to"
            className={styles.select}
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
          >
            {FOREIGN_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.label}
              </option>
            ))}
          </select>
        </div>

        {received !== null && (
          <div className={styles.card}>
            <div className={styles.row}>
              <span>실시간 환율</span>
              <b>{rateInfo.display}</b>
            </div>
            <div className={styles.row}>
              <span>예상 수수료</span>
              <b>₩{FEE_KRW.toLocaleString()}</b>
            </div>
            <div className={styles.row}>
              <span>예상 수령</span>
              <b>
                {toSymbol}
                {received}
              </b>
            </div>
          </div>
        )}
      </div>

      <div className={styles.fixedBtn}>
        <button
          className={styles.primaryBtn}
          disabled={received === null}
          onClick={() =>
            navigate('/exchange/complete', {
              state: {
                fromLabel: `KRW ₩${parseInt(amount).toLocaleString()}`,
                toLabel: `${toCurrency} ${toSymbol}${received}`,
                rateLabel: rateInfo.display,
                fee: `₩${FEE_KRW.toLocaleString()}`,
              },
            })
          }
        >
          환전하기
        </button>
      </div>

      <BottomNav activeIndex={0} />
    </div>
  );
}
