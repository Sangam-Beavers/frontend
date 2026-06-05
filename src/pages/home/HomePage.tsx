import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import { balanceOf, useBalances } from '@/hooks/useBalances';
import { useExchangeRatesWidget } from '@/hooks/useExchangeRatesWidget';
import { useWalletMe } from '@/hooks/useWalletMe';
import { HOME_ALL_CURRENCIES_MOCK, HOME_NOTIFICATIONS_MOCK } from '@/mocks/homeMock';
import type { CurrencyOption } from '@/types/home';
import styles from './HomePage.module.css';

const NOTIFICATIONS = HOME_NOTIFICATIONS_MOCK.result;
const STORAGE_KEY = 'homeCurrencies';

// 통화 기호 매핑 — 백엔드 응답에는 잔액만 있고 기호는 없어서 클라이언트에서 보강.
// 백엔드 지원 통화(KRW/USD/PHP/VND)만 실제 잔액이 들어오고, 나머지(THB/CNY/JPY/EUR)는
// 사용자가 홈 설정에 골라도 항상 0으로 표시된다(잔액 자체가 없음).
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
  THB: '฿',
  CNY: '¥',
  JPY: '¥',
  EUR: '€',
};

function formatBalance(code: string, balance: string): string {
  const symbol = CURRENCY_SYMBOL[code] ?? '';
  const num = Number(balance);
  if (code === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

function loadCurrencies(): CurrencyOption[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const codes: string[] = raw ? JSON.parse(raw) : ['USD', 'VND'];
    return codes
      .map((code) => HOME_ALL_CURRENCIES_MOCK.find((c) => c.code === code))
      .filter((c): c is CurrencyOption => c !== undefined);
  } catch {
    return HOME_ALL_CURRENCIES_MOCK.slice(0, 2);
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(loadCurrencies);
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  // "지금 나의 원화" 카드용 — 보유 통화 전체의 KRW 환산 합계.
  const { data: walletMe, isLoading: walletMeLoading, error: walletMeError } = useWalletMe();
  // 실시간 환율 (KRW 기준 "1 외화→KRW") — 홈 카드용. KRW 제외 전체 통화.
  const { data: ratesData, isLoading: ratesLoading } = useExchangeRatesWidget();

  useEffect(() => {
    setCurrencies(loadCurrencies());
  }, []);

  // 메인 KRW 잔액 표시. 지갑 없음(WALLET4001)이면 ₩0으로 fallback (가입 직후 등 일시 상태).
  // 그 외 에러는 로딩 중 표시와 동일하게 "—"로 두어 가짜 값 노출을 피함.
  const krwBalance =
    balancesError instanceof ApiException && balancesError.code === 'WALLET4001'
      ? '0.0000'
      : balanceOf(balances, 'KRW');
  const mainAmount = balancesLoading ? '—' : formatBalance('KRW', krwBalance);

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
        <div className={styles.amount}>{mainAmount}</div>
        <div
          className={styles.walletRowClickable}
          onClick={() => navigate('/home/currency-settings')}
        >
          <span>선택 표시 통화 {currencies.length}개</span>
          <span>설정 ›</span>
        </div>
        <div className={styles.currencyGrid}>
          {currencies.map((currency) => {
            // 사용자가 고른 통화의 실제 잔액. 백엔드 미지원 통화(THB/CNY/JPY/EUR)는 0으로 표시됨.
            const display = balancesLoading
              ? `${currency.code} —`
              : `${currency.code} ${formatBalance(currency.code, balanceOf(balances, currency.code))}`;
            return (
              <div key={currency.code} className={styles.currencyChip}>
                {display}
              </div>
            );
          })}
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

      {/* "지금 나의 원화" 환산 총액 (GET /wallets/me).
          로딩 중 '—' / WALLET4001(지갑 없음) 시 ₩0 fallback — 가짜 값 노출 방지. */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>지금 나의 원화</div>
        <div className={styles.cardText}>모든 통화를 현재 환율로 바꾸면</div>
        <div className={styles.totalAmount}>
          {walletMeLoading
            ? '—'
            : walletMeError instanceof ApiException && walletMeError.code === 'WALLET4001'
              ? '₩0'
              : `₩${Number(walletMe?.total_balance_in_krw ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        </div>
      </div>

      {/* 실시간 환율 (GET /wallets/exchange-rates) — KRW 기준 "1 외화→KRW" + 등락률.
          로딩 중 빈 자리, dev 환경은 Mock 고정값이라 등락률 0으로 내려옴. */}
      <div className={styles.section}>
        실시간 환율
        <span
          className={styles.pill}
          onClick={() => navigate('/exchange/rates')}
          style={{ cursor: 'pointer' }}
        >
          전체보기
        </span>
      </div>
      <div className={styles.scrollRow}>
        {ratesLoading ? (
          <div className={styles.rateCard}>
            <span className={styles.rateLabel}>불러오는 중...</span>
          </div>
        ) : (
          (ratesData?.rates ?? []).map((rate) => {
            const isUp = rate.change_rate >= 0;
            const changeAbs = Math.abs(rate.change_rate);
            const changeLabel = `${isUp ? '▲' : '▼'} ${changeAbs.toFixed(2)}%`;
            const rateLabel = Number(rate.exchange_rate).toLocaleString(undefined, {
              maximumFractionDigits: 4,
            });
            return (
              <div
                key={rate.currency_code}
                className={styles.rateCard}
                onClick={() => navigate('/exchange/form')}
                style={{ cursor: 'pointer' }}
              >
                <span className={styles.rateLabel}>
                  {rate.currency_name} {rate.currency_code}
                </span>
                <b className={styles.rateValue}>{rateLabel}</b>
                <span className={`${styles.rateChange} ${isUp ? styles.rateUp : styles.rateDown}`}>
                  {changeLabel}
                </span>
              </div>
            );
          })
        )}
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
