import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import { ROUTES } from '@/constants/routes';
import { balanceOf, useBalances } from '@/hooks/useBalances';
import { useExchangeRatesWidget } from '@/hooks/useExchangeRatesWidget';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useWalletMe } from '@/hooks/useWalletMe';
import { HOME_ALL_CURRENCIES_MOCK, HOME_NOTIFICATIONS_MOCK } from '@/mocks/homeMock';
import type { CurrencyOption } from '@/types/home';
import styles from './HomePage.module.css';

// 알림 카드는 mock 데이터지만 표시 라벨은 i18n 키로 매핑한다(이슈 #153).
const NOTIFICATION_KEYS: Record<string, { titleKey: string; descKey: string }> = {
  fraud: { titleKey: 'home.notifications.fraudTitle', descKey: 'home.notifications.fraudDesc' },
  legal: { titleKey: 'home.notifications.legalTitle', descKey: 'home.notifications.legalDesc' },
};
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
  const { t, i18n } = useTranslation();
  const [currencies, setCurrencies] = useState<CurrencyOption[]>(loadCurrencies);
  const { data: balances, isLoading: balancesLoading, error: balancesError } = useBalances();
  // 이슈 #108 — 신분증 미인증 사용자는 전자지갑 카드 자체를 잠그고 인증 안내로 교체한다.
  const { data: profile } = useMyProfile();
  const isVerified = profile?.is_verified ?? false;
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

  // 현재 언어 코드 (i18n 기준). 헤더의 언어 셀렉터에 표시.
  const currentLangCode = (i18n.language || 'ko').toUpperCase().slice(0, 2);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logoBox} />
          {t('home.appName')}
        </div>
        <div className={styles.headerActions}>
          <button className={styles.langBtn} onClick={() => navigate('/mypage/language')}>
            🌐 {currentLangCode} ▾
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/mypage')}>
            👤
          </button>
        </div>
      </header>

      {isVerified ? (
        <div className={styles.wallet}>
          <div className={styles.walletRow}>
            <span>{t('home.wallet')}</span>
            <span>
              {t('home.mainCurrency')} KRW · {t('home.change')}
            </span>
          </div>
          <div className={styles.amount}>{mainAmount}</div>
          <div
            className={styles.walletRowClickable}
            onClick={() => navigate('/home/currency-settings')}
          >
            <span>{t('home.showingNCurrencies', { count: currencies.length })}</span>
            <span>{t('home.settings')} ›</span>
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
              {t('home.import')}
            </button>
            <button className={styles.walletBtn} onClick={() => navigate('/transfer')}>
              {t('home.send')}
            </button>
            <button className={styles.walletBtn} onClick={() => navigate('/exchange')}>
              {t('home.exchange')}
            </button>
          </div>
          <p className={styles.walletFooter}>{t('home.walletSubtitle')}</p>
        </div>
      ) : (
        // 이슈 #108 — 신분증 미인증 사용자: 전자지갑 카드를 인증 안내로 교체.
        // 환율 위젯·문서분석 등 비금융 기능은 그대로 사용 가능.
        <div className={styles.wallet}>
          <div className={styles.walletRow}>
            <span>{t('home.wallet')}</span>
            <span>{t('home.locked')}</span>
          </div>
          <div className={styles.lockedTitle}>{t('home.lockedTitle')}</div>
          <p className={styles.lockedText}>{t('home.lockedBody')}</p>
          <div className={styles.lockedActions}>
            <button className={styles.walletBtn} onClick={() => navigate(ROUTES.MYPAGE_BADGE)}>
              {t('home.lockedCta')}
            </button>
          </div>
          <p className={styles.walletFooter}>{t('home.walletSubtitle')}</p>
        </div>
      )}

      {/* "지금 나의 원화" 환산 총액 (GET /wallets/me).
          이슈 #108 — 미인증이면 마스킹(가드된 영역이라도 표시 가짜값 방지).
          인증 후엔 실 API 값 표시: 로딩 중 '—' / WALLET4001(지갑 없음) 시 ₩0 fallback. */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('home.myKrwTitle')}</div>
        <div className={styles.cardText}>
          {isVerified ? t('home.myKrwSub') : t('home.unverifiedHint')}
        </div>
        <div className={styles.totalAmount}>
          {!isVerified
            ? '₩ —'
            : walletMeLoading
              ? '—'
              : walletMeError instanceof ApiException && walletMeError.code === 'WALLET4001'
                ? '₩0'
                : `₩${Number(walletMe?.total_balance_in_krw ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        </div>
      </div>

      {/* 실시간 환율 (GET /wallets/exchange-rates) — KRW 기준 "1 외화→KRW" + 등락률.
          로딩 중 빈 자리, dev 환경은 Mock 고정값이라 등락률 0으로 내려옴. */}
      <div className={styles.section}>
        {t('home.ratesTitle')}
        <span
          className={styles.pill}
          onClick={() => navigate('/exchange/rates')}
          style={{ cursor: 'pointer' }}
        >
          {t('home.ratesViewAll')}
        </span>
      </div>
      <div className={styles.scrollRow}>
        {ratesLoading ? (
          <div className={styles.rateCard}>
            <span className={styles.rateLabel}>{t('home.ratesLoading')}</span>
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
                  {/* 통화명은 i18n으로 매핑(이슈 #153). 매핑 없으면 백엔드 응답값 fallback. */}
                  {t(`home.currencies.${rate.currency_code}`, {
                    defaultValue: rate.currency_name,
                  })}{' '}
                  {rate.currency_code}
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

      <div className={styles.section}>{t('home.alerts')}</div>
      <div className={styles.scrollRow}>
        {NOTIFICATIONS.map((notif) => {
          // 알림 mock의 title/description은 한국어 — i18n 키로 매핑(이슈 #153).
          // 매핑 없으면 mock 원본을 fallback으로 표시.
          const keyMap = NOTIFICATION_KEYS[notif.id];
          const title = keyMap ? t(keyMap.titleKey, { defaultValue: notif.title }) : notif.title;
          const description = keyMap
            ? t(keyMap.descKey, { defaultValue: notif.description })
            : notif.description;
          return (
            <div
              key={notif.id}
              className={`${styles.card} ${styles.notifCard}`}
              onClick={() =>
                navigate(notif.id === 'legal' ? '/doc-analysis' : '/mypage/wallet-history')
              }
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.cardTitle}>{title}</div>
              <div className={styles.cardText}>{description}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
