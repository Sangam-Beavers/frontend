// ─────────────────────────────────────────────────────────────
// pages/wallet/ExchangeReverse/ExchangeReversePage.tsx — 외화 → 원화 재환전 화면
//
// 흐름과 state 머신은 ExchangeFormPage와 동일.
// exchange_type 만 RE_EXCHANGE 이고, from/to 통화만 반대.
// 자세한 주석은 ExchangeFormPage.tsx 참고.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiException, walletApi, type ExchangeQuoteResponse } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useSupportedCurrencies } from '@/hooks/useSupportedCurrencies';
import styles from './ExchangeReversePage.module.css';

type Phase = 'INPUT' | 'QUOTING' | 'LOCKED' | 'EXECUTING';

export default function ExchangeReversePage() {
  const { t } = useTranslation();
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
        setError(t('exchange.reverse.errQuoteExpired'));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [quote, t]);

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
        if (e.code === 'TRANSFER4002') setError(t('exchange.reverse.errUnsupportedCurrency'));
        else if (e.code === 'COMMON4001')
          setError(e.message || t('exchange.reverse.errInvalidInput'));
        else if (e.code === 'NETWORK_ERROR') setError(t('exchange.reverse.errNetwork'));
        else setError(e.message || t('exchange.reverse.errQuoteFailed'));
      } else {
        setError(t('exchange.reverse.errQuoteFailed'));
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
          setError(t('exchange.reverse.errQuoteExpired'));
          setQuote(null);
          idempotencyKeyRef.current = null;
          setPhase('INPUT');
          return;
        }
        if (e.code === 'WALLET4002') {
          setError(e.message || t('exchange.reverse.errInsufficient'));
        } else if (e.code === 'NETWORK_ERROR') {
          setError(t('exchange.reverse.errNetwork'));
        } else {
          setError(e.message || t('exchange.reverse.errExecuteFailed'));
        }
      } else {
        setError(t('exchange.reverse.errExecuteFailed'));
      }
      setPhase('LOCKED');
    }
  }

  const inputsDisabled = phase === 'QUOTING' || phase === 'EXECUTING';

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('exchange.reverse.title')} onBack={() => navigate(ROUTES.EXCHANGE)} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>{t('exchange.reverse.headerTitle')}</div>
          <div className={styles.cardText}>{t('exchange.reverse.headerText')}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="rev-from">
            {t('exchange.reverse.fromLabel')}
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
            {t('exchange.reverse.amountLabel')}
          </label>
          <input
            id="rev-amount"
            type="number"
            inputMode="decimal"
            className={styles.input}
            placeholder={t('exchange.reverse.amountPlaceholder')}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={inputsDisabled}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('exchange.reverse.toLabel')}</label>
          <div className={styles.inputReadonly}>{t('exchange.reverse.krwReadonly')}</div>
        </div>

        {quote && phase === 'LOCKED' && (
          <div className={styles.card}>
            <div className={styles.row}>
              <span>{t('exchange.reverse.rateLabel')}</span>
              <b>
                1 {fromCurrency} = ₩{Number(quote.exchange_rate).toLocaleString()}
              </b>
            </div>
            <div className={styles.row}>
              <span>{t('exchange.reverse.feeLabel')}</span>
              <b>
                ₩{Number(quote.fee).toLocaleString()} ({quote.fee_currency_code})
              </b>
            </div>
            <div className={styles.row}>
              <span>{t('exchange.reverse.receiveLabel')}</span>
              <b>₩{Number(quote.receive_amount).toLocaleString()}</b>
            </div>
            <div className={styles.row}>
              <span>{t('exchange.reverse.expiresLabel')}</span>
              <b>
                {t('exchange.reverse.expiresValue', {
                  minutes: Math.floor(secondsLeft / 60),
                  seconds: secondsLeft % 60,
                })}
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
            {t('exchange.reverse.confirmCta')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canQuote || inputsDisabled}
            onClick={handleGetQuote}
          >
            {phase === 'QUOTING' ? t('exchange.reverse.quoting') : t('exchange.reverse.quoteCta')}
          </button>
        )}
      </div>
    </>
  );
}
