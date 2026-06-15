import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import type { ExchangeRateItem } from '@/api/wallet';
import { ROUTES } from '@/constants/routes';
import { SUPPORTED_CURRENCIES, CURRENCY_SYMBOL, isSupportedCurrency } from '@/constants/currencies';
import { isAdminUser } from '@/auth/tokenStore';
import { balanceOf, useBalances } from '@/hooks/useBalances';
import { useExchangeRatesWidget } from '@/hooks/useExchangeRatesWidget';
import { useSetting } from '@/hooks/useServiceSettings';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useWalletMe } from '@/hooks/useWalletMe';
import { useSecuritySummary } from '@/hooks/useSecuritySummary';
import { UserIcon, WalletIcon } from '@/components/common/icons';
import { HOME_NOTIFICATIONS_MOCK } from '@/mocks/homeMock';
import styles from './HomePage.module.css';

// 알림 카드는 mock 데이터지만 표시 라벨은 i18n 키로 매핑한다(이슈 #153).
const NOTIFICATION_KEYS: Record<string, { titleKey: string; descKey: string }> = {
  fraud: { titleKey: 'home.notifications.fraudTitle', descKey: 'home.notifications.fraudDesc' },
  legal: { titleKey: 'home.notifications.legalTitle', descKey: 'home.notifications.legalDesc' },
};
const NOTIFICATIONS = HOME_NOTIFICATIONS_MOCK.result;
const STORAGE_KEY = 'homeCurrencies';
const MAIN_CURRENCY_KEY = 'homeMainCurrency'; // 메인 통화(이슈 #194) — 기본 KRW

function formatBalance(code: string, balance: string): string {
  const symbol = CURRENCY_SYMBOL[code] ?? '';
  const num = Number(balance);
  if (code === 'KRW') return `${symbol} ${num.toLocaleString()}`;
  return `${symbol} ${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

/** 표시 통화(홈 칩) 코드 목록 — localStorage에서 읽어 지원 통화로 정제. */
function loadDisplayCurrencies(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const codes: string[] = raw ? JSON.parse(raw) : ['USD', 'VND'];
    return codes.filter(isSupportedCurrency);
  } catch {
    return ['USD', 'VND'];
  }
}

/** 메인 통화 코드 — localStorage에서 읽어 지원 통화면 사용, 아니면 KRW. */
function loadMainCurrency(): string {
  try {
    const raw = localStorage.getItem(MAIN_CURRENCY_KEY);
    return raw && isSupportedCurrency(raw) ? raw : 'KRW';
  } catch {
    return 'KRW';
  }
}

/** 통화별 표시 포맷(KRW는 정수, 외화는 소수 2자리). */
function formatAmountByCurrency(code: string, value: number): string {
  const symbol = CURRENCY_SYMBOL[code] ?? '';
  if (code === 'KRW') return `${symbol} ${Math.round(value).toLocaleString()}`;
  return `${symbol} ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * 총 원화환산액(total_balance_in_krw)을 메인 통화로 환산해 문자열로 반환한다(이슈 #194).
 * KRW면 그대로, 외화면 ÷(1 외화→KRW 환율). 환율을 모르면 null(호출 측이 '—' 처리).
 */
function formatMainAmount(
  currency: string,
  totalKrw: number,
  rates?: ExchangeRateItem[]
): string | null {
  if (currency === 'KRW') return formatAmountByCurrency('KRW', totalKrw);
  const rate = rates?.find((r) => r.currency_code === currency)?.exchange_rate;
  const rateNum = Number(rate);
  if (!rate || !rateNum) return null;
  return formatAmountByCurrency(currency, totalKrw / rateNum);
}

export default function HomePage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAdmin = isAdminUser();
  const [currencies, setCurrencies] = useState<string[]>(loadDisplayCurrencies);
  const [mainCurrency, setMainCurrency] = useState<string>(loadMainCurrency);
  const [mainCurrencyOpen, setMainCurrencyOpen] = useState(false);
  const { data: balances, isLoading: balancesLoading } = useBalances();
  // 이슈 #108 — 신분증 미인증 사용자는 전자지갑 카드 자체를 잠그고 인증 안내로 교체한다.
  const { data: profile } = useMyProfile();
  const isVerified = profile?.is_verified ?? false;
  // "지금 나의 원화" 카드용 — 보유 통화 전체의 KRW 환산 합계.
  const { data: walletMe, isLoading: walletMeLoading, error: walletMeError } = useWalletMe();
  const { data: security } = useSecuritySummary();
  // 서비스 설정 — 환율 갱신 주기 (분 단위, 0이면 자동 갱신 없음)
  const rateRefreshMin = Number(useSetting('EXCHANGE_RATE_REFRESH_MIN', '0'));
  const rateRefreshMs = rateRefreshMin > 0 ? rateRefreshMin * 60_000 : 0;
  // 실시간 환율 (KRW 기준 "1 외화→KRW") — 홈 카드용. KRW 제외 전체 통화.
  const { data: ratesData, isLoading: ratesLoading } = useExchangeRatesWidget(
    undefined,
    rateRefreshMs
  );
  useEffect(() => {
    setCurrencies(loadDisplayCurrencies());
  }, []);

  // 메인 통화 변경(이슈 #194) — 선택값을 localStorage에 저장하고 드롭다운을 닫는다.
  const selectMainCurrency = (code: string) => {
    setMainCurrency(code);
    try {
      localStorage.setItem(MAIN_CURRENCY_KEY, code);
    } catch {
      /* 저장 실패는 무시(이번 세션에만 반영) */
    }
    setMainCurrencyOpen(false);
  };

  // 표시 통화 칩 = 저장된 표시 통화 중 메인 통화를 제외한 것(메인은 큰 금액으로 이미 표기).
  const displayCurrencies = currencies.filter((code) => code !== mainCurrency);

  // 카드 큰 금액 = 총 원화환산액(/wallets/me)을 메인 통화로 환산(이슈 #194).
  // 지갑 없음(WALLET4001)이면 0, 로딩/환율 미준비면 '—'.
  const totalKrw =
    walletMeError instanceof ApiException && walletMeError.code === 'WALLET4001'
      ? 0
      : Number(walletMe?.total_balance_in_krw ?? 0);
  const mainAmountReady = !walletMeLoading && (mainCurrency === 'KRW' || !ratesLoading);
  const mainAmount = mainAmountReady
    ? (formatMainAmount(mainCurrency, totalKrw, ratesData?.rates) ?? '—')
    : '—';

  // 현재 언어 코드 (i18n 기준). 헤더의 언어 셀렉터에 표시.
  const currentLangCode = (i18n.language || 'ko').toUpperCase().slice(0, 2);

  return (
    <>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img className={styles.logoBox} src="/logo.png" alt="" />
          {t('home.appName')}
        </div>
        <div className={styles.headerActions}>
          <button
            className={styles.langBtn}
            onClick={() => navigate('/mypage/language', { state: { from: ROUTES.HOME } })}
          >
            🌐 {currentLangCode} ▾
          </button>
          <button
            className={styles.iconBtn}
            onClick={() => navigate('/mypage')}
            aria-label="마이페이지"
          >
            <UserIcon size={22} />
          </button>
        </div>
      </header>

      {/* 관리자 배너 — isAdmin일 때만 표시 */}
      {isAdmin && <div className={styles.adminBanner}>⚙️ Administration</div>}

      {isVerified ? (
        <div className={styles.wallet}>
          <div className={styles.walletRow}>
            <span>{t('home.wallet')}</span>
            {/* 메인 통화 변경(이슈 #194) — 클릭 시 지원 4통화 드롭다운. 선택 시 큰 금액이 해당 통화로 환산됨. */}
            <span style={{ position: 'relative' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setMainCurrencyOpen((o) => !o)}>
                {t('home.mainCurrency')} {mainCurrency} · {t('home.change')} ▾
              </span>
              {mainCurrencyOpen && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '100%',
                    marginTop: 4,
                    background: '#fff',
                    color: '#111',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 10,
                    overflow: 'hidden',
                    minWidth: 132,
                  }}
                >
                  {SUPPORTED_CURRENCIES.map((code) => (
                    <div
                      key={code}
                      onClick={() => selectMainCurrency(code)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: code === mainCurrency ? 700 : 400,
                      }}
                    >
                      {code} · {t(`home.currencies.${code}`)}
                    </div>
                  ))}
                </div>
              )}
            </span>
          </div>
          {/* 총 금액 클릭 → 거래 내역(이슈 #194). */}
          <div
            className={styles.amount}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(ROUTES.MYPAGE_WALLET_HISTORY, { state: { from: ROUTES.HOME } })}
          >
            {mainAmount}
          </div>
          <div
            className={styles.walletRowClickable}
            onClick={() => navigate('/home/currency-settings')}
          >
            <span>{t('home.showingNCurrencies', { count: displayCurrencies.length })}</span>
            <span>{t('home.settings')} ›</span>
          </div>
          <div className={styles.currencyGrid}>
            {displayCurrencies.map((code) => {
              const display = balancesLoading
                ? `${code} —`
                : `${code} ${formatBalance(code, balanceOf(balances, code))}`;
              return (
                <div key={code} className={styles.currencyChip}>
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
        <div className={styles.cardTitle}>
          <WalletIcon size={16} style={{ color: 'var(--blue)', flexShrink: 0 }} />
          {t('home.myKrwTitle')}
        </div>
        <div className={styles.cardText}>
          {isVerified ? t('home.myKrwSub') : t('home.unverifiedHint')}
        </div>
        <div className={styles.totalAmount}>
          {!isVerified
            ? '₩ —'
            : walletMeLoading
              ? '—'
              : walletMeError instanceof ApiException && walletMeError.code === 'WALLET4001'
                ? '₩ 0'
                : `₩ ${Number(walletMe?.total_balance_in_krw ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
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
        {/* 공지사항 카드 — 목록 페이지로 이동 */}
        <div
          className={`${styles.card} ${styles.notifCard}`}
          onClick={() => navigate(ROUTES.NOTICES)}
          style={{ cursor: 'pointer' }}
        >
          <div className={styles.cardTitle}>{t('home.notices.title')}</div>
          <div className={styles.cardText}>{t('home.notices.desc')}</div>
        </div>
        {/* 기존 mock 알림 카드 */}
        {NOTIFICATIONS.map((notif) => {
          // 알림 mock의 title/description은 한국어 — i18n 키로 매핑(이슈 #153).
          // 매핑 없으면 mock 원본을 fallback으로 표시.
          const keyMap = NOTIFICATION_KEYS[notif.id];
          const title = keyMap ? t(keyMap.titleKey, { defaultValue: notif.title }) : notif.title;
          const isFraud = notif.id === 'fraud';
          const fraudWarning = isFraud && security?.status === 'WARNING';
          const description =
            isFraud && security
              ? security.status === 'WARNING'
                ? t('home.notifications.fraudDescWarning', {
                    count: security.suspicious_count,
                    defaultValue: `주의가 필요한 거래 ${security.suspicious_count}건이 있어요.`,
                  })
                : t('home.notifications.fraudDescSafe', {
                    defaultValue: '현재 전자지갑은 안전합니다.',
                  })
              : keyMap
                ? t(keyMap.descKey, { defaultValue: notif.description })
                : notif.description;
          const target = isFraud
            ? ROUTES.MYPAGE_SECURITY_CHECK
            : notif.id === 'legal'
              ? ROUTES.LAWYERS
              : '/mypage/wallet-history';
          return (
            <div
              key={notif.id}
              className={`${styles.card} ${styles.notifCard}${fraudWarning ? ` ${styles.cardWarn}` : ''}`}
              onClick={() => navigate(target)}
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
