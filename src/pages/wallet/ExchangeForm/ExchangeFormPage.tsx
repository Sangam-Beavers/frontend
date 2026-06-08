// ─────────────────────────────────────────────────────────────
// pages/wallet/ExchangeForm/ExchangeFormPage.tsx — 원화 → 외화 환전 화면
//
// 백엔드 환전 흐름은 두 단계라 화면도 두 단계로 동작한다.
//   1) 견적(quote)  : 환율·예상 수령액·만료시각을 백엔드에서 받아 잠근다(5분).
//   2) 실행(execute): 잠긴 견적 id로 실제 환전. Idempotency-Key 헤더로 멱등성 보장.
//
// state 머신:
//   INPUT     사용자가 통화·금액 입력 중. 버튼 "환전 견적 보기".
//   QUOTING   견적 API 진행 중. 버튼 비활성.
//   LOCKED    견적 받음. 환율 표시 + 카운트다운 + "환전 확정" 버튼.
//             입력이 바뀌면 LOCKED → INPUT 으로 자동 복귀(잘못된 값 실행 방지).
//   EXECUTING 실행 API 진행 중. 버튼 비활성.
//   (성공 시 ExchangeCompletePage로 이동)
//
// 에러 분기 (ApiException.code):
//   TRANSFER4002 (미지원 통화)   → 입력 화면에 메시지 (드롭다운으로 거의 발생 X)
//   COMMON4001  (형식 오류)      → 입력 화면에 메시지
//   EXCHANGE4002 (견적 만료)     → 잠금 해제 + "견적이 만료됐어요" + 다시 견적 유도
//   WALLET4002  (잔액 부족)      → 잠금 유지 + 잔액 부족 안내
//   AUTH4011                     → apiClient interceptor가 로그인 화면 이동(자동)
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiException, walletApi, type ExchangeQuoteResponse } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { ROUTES } from '@/constants/routes';
import { useSupportedCurrencies } from '@/hooks/useSupportedCurrencies';
import styles from './ExchangeFormPage.module.css';

type Phase = 'INPUT' | 'QUOTING' | 'LOCKED' | 'EXECUTING';

export default function ExchangeFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: currenciesData } = useSupportedCurrencies();
  // KRW 제외한 지원 통화만 드롭다운에 노출. 데이터 도착 전엔 빈 배열.
  const foreignList = useMemo(
    () => currenciesData?.currencies.filter((c) => c.currency_code !== 'KRW') ?? [],
    [currenciesData]
  );

  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('');
  const [phase, setPhase] = useState<Phase>('INPUT');
  const [quote, setQuote] = useState<ExchangeQuoteResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // 실행 단계의 멱등 키. quote가 잠긴 시점에 한 번 생성하고, 실행 재시도 시 같은 키를 보낸다.
  // (매번 새 키를 만들면 백엔드 입장에서 다른 요청이라 멱등성이 무의미해짐.)
  const idempotencyKeyRef = useRef<string | null>(null);

  // 드롭다운 첫 로드 후 기본 선택 통화가 응답에 없으면 응답 첫 번째로 보정 (PHP/VND 등 자동 적응).
  useEffect(() => {
    if (foreignList.length > 0 && !foreignList.some((c) => c.currency_code === toCurrency)) {
      setToCurrency(foreignList[0].currency_code);
    }
  }, [foreignList, toCurrency]);

  // LOCKED 상태에서 입력이 바뀌면 잠금 해제 (잘못된 값으로 실행되는 사고 방지).
  // QUOTING/EXECUTING 중엔 입력 자체를 비활성화하므로 여기 도달하지 않는다.
  useEffect(() => {
    if (phase === 'LOCKED') {
      setPhase('INPUT');
      setQuote(null);
      idempotencyKeyRef.current = null;
    }
    // 의도적으로 amount/toCurrency만 트리거 — phase 변화 자체로 다시 INPUT 으로 가지 않게.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, toCurrency]);

  // 만료 카운트다운. quote 받은 직후부터 1초마다 남은 초 계산하고,
  // 0초가 되면 자동으로 INPUT으로 되돌려 사용자에게 "다시 견적" 액션을 유도한다
  // (잠긴 견적으로 실행 누를 위험 차단). 입력값은 유지하므로 다시 누르기만 하면 됨.
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
        setError(t('exchange.form.errQuoteExpired'));
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [quote, t]);

  const numericAmount = parseFloat(amount);
  const canQuote = phase === 'INPUT' && foreignList.length > 0 && !!toCurrency && numericAmount > 0;

  async function handleGetQuote() {
    setError(null);
    setPhase('QUOTING');
    try {
      const res = await walletApi.createExchangeQuote({
        exchange_type: 'EXCHANGE',
        from_currency_code: 'KRW',
        to_currency_code: toCurrency,
        amount,
      });
      setQuote(res);
      // 잠금 시점에 멱등키 1회 생성. 실행 재시도 시에도 동일 키 사용.
      idempotencyKeyRef.current = crypto.randomUUID();
      setPhase('LOCKED');
    } catch (e) {
      setPhase('INPUT');
      if (e instanceof ApiException) {
        if (e.code === 'TRANSFER4002') setError(t('exchange.form.errUnsupportedCurrency'));
        else if (e.code === 'COMMON4001') setError(e.message || t('exchange.form.errInvalidInput'));
        else if (e.code === 'NETWORK_ERROR') setError(t('exchange.form.errNetwork'));
        else setError(e.message || t('exchange.form.errQuoteFailed'));
      } else {
        setError(t('exchange.form.errQuoteFailed'));
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
      // 성공 — 결과 객체를 그대로 Complete 화면으로 전달.
      navigate(ROUTES.EXCHANGE_COMPLETE, { state: { result } });
    } catch (e) {
      if (e instanceof ApiException) {
        if (e.code === 'EXCHANGE4002') {
          // 견적 만료 — 잠금 해제하고 다시 견적 받게 유도.
          setError(t('exchange.form.errQuoteExpired'));
          setQuote(null);
          idempotencyKeyRef.current = null;
          setPhase('INPUT');
          return;
        }
        if (e.code === 'WALLET4002') {
          setError(e.message || t('exchange.form.errInsufficient'));
        } else if (e.code === 'NETWORK_ERROR') {
          setError(t('exchange.form.errNetwork'));
        } else {
          setError(e.message || t('exchange.form.errExecuteFailed'));
        }
      } else {
        setError(t('exchange.form.errExecuteFailed'));
      }
      // 잠금 유지 — 같은 idempotency key로 재시도 가능.
      setPhase('LOCKED');
    }
  }

  const inputsDisabled = phase === 'QUOTING' || phase === 'EXECUTING';
  const toSymbol = foreignList.find((c) => c.currency_code === toCurrency)?.currency_symbol ?? '';

  return (
    <>
      <div className={styles.contentExtraPad}>
        <TopBar title={t('exchange.form.title')} onBack={() => navigate(ROUTES.EXCHANGE)} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>{t('exchange.form.headerTitle')}</div>
          <div className={styles.cardText}>{t('exchange.form.headerText')}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>{t('exchange.form.fromLabel')}</label>
          <div className={styles.inputReadonly}>{t('exchange.form.krwReadonly')}</div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="exch-amount">
            {t('exchange.form.amountLabel')}
          </label>
          <input
            id="exch-amount"
            type="number"
            inputMode="decimal"
            className={styles.input}
            placeholder={t('exchange.form.amountPlaceholder')}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={inputsDisabled}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="exch-to">
            {t('exchange.form.toLabel')}
          </label>
          <select
            id="exch-to"
            className={styles.select}
            value={toCurrency}
            onChange={(e) => setToCurrency(e.target.value)}
            disabled={inputsDisabled || foreignList.length === 0}
          >
            {foreignList.map((c) => (
              <option key={c.currency_code} value={c.currency_code}>
                {c.currency_code} {c.currency_name}
              </option>
            ))}
          </select>
        </div>

        {quote && phase === 'LOCKED' && (
          <div className={styles.card}>
            <div className={styles.row}>
              <span>{t('exchange.form.rateLabel')}</span>
              <b>
                1 {quote.receive_currency_code} = ₩{Number(quote.exchange_rate).toLocaleString()}
              </b>
            </div>
            <div className={styles.row}>
              <span>{t('exchange.form.feeLabel')}</span>
              <b>
                ₩{Number(quote.fee).toLocaleString()} ({quote.fee_currency_code})
              </b>
            </div>
            <div className={styles.row}>
              <span>{t('exchange.form.receiveLabel')}</span>
              <b>
                {toSymbol}
                {Number(quote.receive_amount).toLocaleString()}
              </b>
            </div>
            <div className={styles.row}>
              <span>{t('exchange.form.expiresLabel')}</span>
              <b>
                {t('exchange.form.expiresValue', {
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
            {t('exchange.form.confirmCta')}
          </button>
        ) : (
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!canQuote || inputsDisabled}
            onClick={handleGetQuote}
          >
            {phase === 'QUOTING' ? t('exchange.form.quoting') : t('exchange.form.quoteCta')}
          </button>
        )}
      </div>
    </>
  );
}
