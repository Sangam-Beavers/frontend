import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useExchangeRatesWidget } from '@/hooks/useExchangeRatesWidget';
import styles from './ExchangeRateFullPage.module.css';

type Region = '아시아' | '미주';

// 통화별 지역·단위 라벨 메타 — 백엔드 응답엔 없어서 클라이언트 보강.
// 새 통화 추가 시 이 맵에 한 줄 추가하면 됨. fallback: 지역 '아시아', 단위 '1단위 기준'.
const CURRENCY_META: Record<string, { region: Region; unit: string }> = {
  USD: { region: '미주', unit: '1달러 기준' },
  PHP: { region: '아시아', unit: '1페소 기준' },
  VND: { region: '아시아', unit: '1동 기준' },
};

const TABS = ['전체', '즐겨찾기', '아시아', '미주'] as const;
type Tab = (typeof TABS)[number];

export default function ExchangeRateFullPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('전체');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { data, isLoading, isFetching, error, refetch } = useExchangeRatesWidget();

  const tabLabels: Record<Tab, string> = {
    전체: t('exchange.rateFull.tabAll'),
    즐겨찾기: t('exchange.rateFull.tabFavorites'),
    아시아: t('exchange.rateFull.tabAsia'),
    미주: t('exchange.rateFull.tabAmericas'),
  };

  const unitLabels: Record<string, string> = {
    USD: t('exchange.rateFull.unitUsd'),
    PHP: t('exchange.rateFull.unitPhp'),
    VND: t('exchange.rateFull.unitVnd'),
  };

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // 백엔드 응답 + 지역/단위 메타를 합쳐 화면용 항목으로.
  const items = useMemo(() => {
    const rates = data?.rates ?? [];
    return rates.map((r) => {
      const meta = CURRENCY_META[r.currency_code] ?? {
        region: '아시아' as Region,
        unit: t('exchange.rateFull.unitDefault'),
      };
      const isUp = r.change_rate >= 0;
      const changeLabel = `${isUp ? '▲' : '▼'} ${Math.abs(r.change_rate).toFixed(2)}%`;
      const rateLabel = Number(r.exchange_rate).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      });
      const localizedUnit = unitLabels[r.currency_code] ?? meta.unit;
      return {
        code: r.currency_code,
        // 통화명은 i18n 매핑(이슈 #153) — 사전에 없는 코드는 백엔드 응답 그대로.
        country: t(`home.currencies.${r.currency_code}`, { defaultValue: r.currency_name }),
        unit: localizedUnit,
        rate: rateLabel,
        change: changeLabel,
        isUp,
        region: meta.region,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, t]);

  const filtered = items.filter((item) => {
    if (activeTab === '즐겨찾기') return favorites.has(item.code);
    if (activeTab === '아시아') return item.region === '아시아';
    if (activeTab === '미주') return item.region === '미주';
    return true;
  });

  // 에러 분기 — TRANSFER4002는 미지원 통화. 표시 자체가 의미 없으니 안내.
  const errorMessage =
    error instanceof ApiException
      ? error.code === 'TRANSFER4002'
        ? t('exchange.rateFull.errUnsupported')
        : error.message || t('exchange.rateFull.errFailed')
      : error
        ? t('exchange.rateFull.errFailed')
        : null;

  return (
    <>
      <TopBar
        title={t('exchange.rateFull.title')}
        onBack={() => navigate('/')}
        rightAction={
          <button
            className={styles.iconBtn}
            aria-label={t('exchange.rateFull.refresh')}
            onClick={() => refetch()}
            disabled={isFetching}
          >
            ↻
          </button>
        }
      />

      <div className={styles.softbox}>
        <div className={styles.softboxTitle}>{t('exchange.rateFull.baseCurrency')}</div>
        <div className={styles.softboxText}>{t('exchange.rateFull.baseCurrencyText')}</div>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tabLabels[tab]}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.empty}>{t('exchange.rateFull.loading')}</div>
        ) : errorMessage ? (
          <div className={styles.empty}>{errorMessage}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {activeTab === '즐겨찾기'
              ? t('exchange.rateFull.emptyFavorites')
              : t('exchange.rateFull.emptyRates')}
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.code} className={styles.rate}>
              <div>
                <div className={styles.rateCountry}>{item.country}</div>
                <div className={styles.rateCode}>
                  {item.code} · {item.unit}
                </div>
              </div>
              <div className={styles.rateRight}>
                <div className={styles.rateValue}>{item.rate}</div>
                <div className={item.isUp ? styles.rateUp : styles.rateDown}>{item.change}</div>
              </div>
              <button
                type="button"
                className={`${styles.starBtn} ${favorites.has(item.code) ? styles.starOn : ''}`}
                onClick={() => toggleFavorite(item.code)}
                aria-label={
                  favorites.has(item.code)
                    ? t('exchange.rateFull.unfavorite')
                    : t('exchange.rateFull.favorite')
                }
              >
                {favorites.has(item.code) ? '★' : '☆'}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}
