import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { FOREIGN_CURRENCIES } from '@/constants/currencies';
import { EXCHANGE_RATES_FORM_MOCK } from '@/mocks/exchangeMock';
import styles from './ExchangeFormPage.module.css';

const RATES = EXCHANGE_RATES_FORM_MOCK.result;
const FEE_KRW = 1000;

export default function ExchangeFormPage() {
  const navigate = useNavigate();
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');

  const num = parseFloat(amount) || 0;
  const rateInfo = RATES[toCurrency];
  const toSymbol = FOREIGN_CURRENCIES.find((c) => c.code === toCurrency)?.symbol ?? '';
  const netKrw = num - FEE_KRW;
  const received = netKrw > 0 ? (netKrw * rateInfo.rate).toFixed(2) : null;

  return (
    <>
      <div className={styles.contentExtraPad}>
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
    </>
  );
}
