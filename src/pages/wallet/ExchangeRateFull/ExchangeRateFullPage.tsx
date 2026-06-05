import { useMemo, useState } from 'react';
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('전체');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { data, isLoading, isFetching, error, refetch } = useExchangeRatesWidget();

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
        unit: '1단위 기준',
      };
      const isUp = r.change_rate >= 0;
      const changeLabel = `${isUp ? '▲' : '▼'} ${Math.abs(r.change_rate).toFixed(2)}%`;
      const rateLabel = Number(r.exchange_rate).toLocaleString(undefined, {
        maximumFractionDigits: 4,
      });
      return {
        code: r.currency_code,
        country: r.currency_name,
        unit: meta.unit,
        rate: rateLabel,
        change: changeLabel,
        isUp,
        region: meta.region,
      };
    });
  }, [data]);

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
        ? '환율을 불러올 수 없습니다.'
        : error.message || '환율 조회에 실패했습니다.'
      : error
        ? '환율 조회에 실패했습니다.'
        : null;

  return (
    <>
      <TopBar
        title="실시간 환율"
        onBack={() => navigate('/')}
        rightAction={
          <button
            className={styles.iconBtn}
            aria-label="새로고침"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            ↻
          </button>
        }
      />

      <div className={styles.softbox}>
        <div className={styles.softboxTitle}>기준 통화 KRW</div>
        <div className={styles.softboxText}>
          현재 시점 기준 환율입니다. 환전 시점에 따라 실제 적용 환율은 달라질 수 있습니다.
        </div>
      </div>

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isLoading ? (
          <div className={styles.empty}>불러오는 중...</div>
        ) : errorMessage ? (
          <div className={styles.empty}>{errorMessage}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            {activeTab === '즐겨찾기' ? '즐겨찾기한 통화가 없습니다' : '표시할 환율이 없습니다'}
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
                aria-label={favorites.has(item.code) ? '즐겨찾기 해제' : '즐겨찾기 추가'}
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
