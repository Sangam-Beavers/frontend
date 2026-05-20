import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import TopBar from '../components/TopBar';
import styles from './ExchangeReversePage.module.css';

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
  USD: { rate: 1370, display: '1 USD = ₩1,370' },
  VND: { rate: 0.054, display: '1 VND = ₩0.054' },
  THB: { rate: 38.5, display: '1 THB = ₩38.5' },
  CNY: { rate: 192, display: '1 CNY = ₩192' },
};

const FEE_KRW = 1000;

export default function ExchangeReversePage() {
  const navigate = useNavigate();
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [amount, setAmount] = useState('');

  const num = parseFloat(amount) || 0;
  const rateInfo = RATES[fromCurrency];
  const fromSymbol = FOREIGN_CURRENCIES.find((c) => c.code === fromCurrency)?.symbol ?? '';
  const received = num > 0 ? Math.round(num * rateInfo.rate - FEE_KRW) : null;

  function handleSubmit() {
    if (received === null) return;
    navigate('/exchange/complete', {
      state: {
        fromLabel: `${fromCurrency} ${fromSymbol}${amount}`,
        toLabel: `KRW ₩${received.toLocaleString()}`,
        rateLabel: rateInfo.display,
        fee: `₩${FEE_KRW.toLocaleString()}`,
      },
    });
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="재환전하기" onBack={() => navigate('/exchange')} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>외화 → 원화 재환전</div>
          <div className={styles.cardText}>전자지갑에 보관된 외화를 원화로 바꿉니다.</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="rev-from">
            보낼 통화
          </label>
          <select
            id="rev-from"
            className={styles.select}
            value={fromCurrency}
            onChange={(e) => setFromCurrency(e.target.value)}
          >
            {FOREIGN_CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="rev-amount">
            재환전 금액
          </label>
          <input
            id="rev-amount"
            type="number"
            className={styles.input}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>받을 통화</label>
          <div className={styles.inputReadonly}>KRW 원화</div>
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
              <b>₩{received.toLocaleString()}</b>
            </div>
          </div>
        )}
      </div>

      <div className={styles.fixedBtn}>
        <button className={styles.primaryBtn} disabled={received === null} onClick={handleSubmit}>
          재환전하기
        </button>
      </div>

      <BottomNav activeIndex={0} />
    </div>
  );
}
