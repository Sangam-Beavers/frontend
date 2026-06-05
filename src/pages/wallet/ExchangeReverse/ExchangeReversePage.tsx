// ─────────────────────────────────────────────────────────────
// pages/wallet/ExchangeReverse/ExchangeReversePage.tsx — 외화 → 원화 재환전 화면
//
// 흐름과 state 머신은 ExchangeFormPage와 동일.
// exchange_type 만 RE_EXCHANGE 이고, from/to 통화만 반대.
// 자세한 주석은 ExchangeFormPage.tsx 참고.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException, walletApi, type ExchangeQuoteResponse } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useSupportedCurrencies } from '@/hooks/useSupportedCurrencies';
import styles from './ExchangeReversePage.module.css';

type Phase = 'INPUT' | 'QUOTING' | 'LOCKED' | 'EXECUTING';

export default function ExchangeReversePage() {
  const navigate = useNavigate();
  const { data: currenciesData } = useSupportedCurrencies();
  const foreignList = useMemo(
    () => currenciesData?.currencies.filter((c) => c.currency_code !== 'KRW') ?? [],
    [currenciesData]
  );

  const [fromCurrency, setFromCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('INPUT');
  const [quote, setQuote] = useState<ExchangeQuoteResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (foreignList.length > 0 && !foreignList.some((c) => c.currency_code === fromCurrency)) {
      setFromCurrency(foreignList[0].currency_code);
    }
  }, [foreignList, fromCurrency]);

  useEffect(() => {
    if (phase === 'LOCKED') {
      setPhase('INPUT');
      setQuote(null);
      idempotencyKeyRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, fromCurrency]);

  useEffect(() => {
    if (!quote) {
      setSecondsLeft(0);
      return;
    }
    const expiresAtMs = Date.parse(quote.expires_at);
    const tick = () => {
      const left = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        setQuote(null);
        idempotencyKeyRef.current = null;
        setPhase('INPUT');
        setError('견적이 만료되었습니다. 다시 견적을 받아주세요.');
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [quote]);

  const numericAmount = parseFloat(amount);
  const canQuote =
    phase === 'INPUT' && foreignList.length > 0 && !!fromCurrency && numericAmount > 0;

  async function handleGetQuote() {
    setError(null);
    setPhase('QUOTING');
    try {
      const res = await walletApi.createExchangeQuote({
        exchange_type: 'RE_EXCHANGE',
        from_currency_code: fromCurrency,
        to_currency_code: 'KRW',
        amount,
      });
      setQuote(res);
      idempotencyKeyRef.current = crypto.randomUUID();
      setPhase('LOCKED');
    } catch (e) {
      setPhase('INPUT');
      if (e instanceof ApiException) {
        if (e.code === 'TRANSFER4002') setError('지원하지 않는 통화입니다.');
        else if (e.code === 'COMMON4001') setError(e.message || '입력값을 확인해주세요.');
        else if (e.code === 'NETWORK_ERROR')
          setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        else setError(e.message || '견적 조회에 실패했습니다.');
      } else {
        setError('견적 조회에 실패했습니다.');
      }
    }
  }

  async function handleExecute() {
    if (!quote || !idempotencyKeyRef.current) return;
    setError(null);
    setPhase('EXECUTING');
    try {
      const result = await walletApi.executeExchange(
        { quote_public_id: quote.quote_public_id },
        idempotencyKeyRef.current
      );
      navigate(ROUTES.EXCHANGE_COMPLETE, { state: { result } });
    } catch (e) {
      if (e instanceof ApiException) {
        if (e.code === 'EXCHANGE4002') {
          setError('견적이 만료되었습니다. 다시 견적을 받아주세요.');
          setQuote(null);
          idempotencyKeyRef.current = null;
          setPhase('INPUT');
          return;
        }
        if (e.code === 'WALLET4002') {
          setError(e.message || '잔액이 부족합니다.');
        } else if (e.code === 'NETWORK_ERROR') {
          setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setError(e.message || '재환전 실행에 실패했습니다.');
        }
      } else {
        setError('재환전 실행에 실패했습니다.');
      }
      setPhase('LOCKED');
    }
  }

  const inputsDisabled = phase === 'QUOTING' || phase === 'EXECUTING';

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title="재환전하기" onBack={() => navigate(ROUTES.EXCHANGE)} />

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
            disabled={inputsDisabled || foreignList.length === 0}
          >
            {foreignList.map((c) => (
              <option key={c.currency_code} value={c.currency_code}>
                {c.currency_code} {c.currency_name}
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
            inputMode="decimal"
            className={styles.input}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={inputsDisabled}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>받을 통화</label>
          <div className={styles.inputReadonly}>KRW 원화</div>
        </div>

        {quote && phase === 'LOCKED' && (
          <div className={styles.card}>
            <div className={styles.row}>
              <span>적용 환율</span>
              <b>
                1 {fromCurrency} = ₩{Number(quote.exchange_rate).toLocaleString()}
              </b>
            </div>
            <div className={styles.row}>
              <span>수수료</span>
              <b>
                ₩{Number(quote.fee).toLocaleString()} ({quote.fee_currency_code})
              </b>
            </div>
            <div className={styles.row}>
              <span>예상 수령</span>
              <b>₩{Number(quote.receive_amount).toLocaleString()}</b>
            </div>
            <div className={styles.row}>
              <span>견적 유효시간</span>
              <b>
                {Math.floor(secondsLeft / 60)}분 {secondsLeft % 60}초 남음
              </b>
            </div>
          </div>
        )}

        {error && (
          <div className={`${styles.card}`} role="alert">
            <div className={styles.cardText}>{error}</div>
          </div>
        )}
      </div>

      <div className={styles.fixedBtn}>
        {phase === 'LOCKED' ? (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={secondsLeft <= 0}
            onClick={handleExecute}
          >
            재환전 확정
          </button>
        ) : (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canQuote || inputsDisabled}
            onClick={handleGetQuote}
          >
            {phase === 'QUOTING' ? '조회 중...' : '재환전 견적 보기'}
          </button>
        )}
      </div>
    </>
  );
}
