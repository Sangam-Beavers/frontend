import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './ExchangeRateFullPage.module.css';

type Region = '아시아' | '미주';

interface RateItem {
  country: string;
  code: string;
  unit: string;
  rate: string;
  change: string;
  isUp: boolean;
  region: Region;
}

const ALL_RATES: RateItem[] = [
  {
    country: '미국 달러',
    code: 'USD',
    unit: '1달러 기준',
    rate: '1,370',
    change: '▲ 0.4%',
    isUp: true,
    region: '미주',
  },
  {
    country: '베트남 동',
    code: 'VND',
    unit: '1동 기준',
    rate: '0.054',
    change: '▼ 0.1%',
    isUp: false,
    region: '아시아',
  },
  {
    country: '태국 바트',
    code: 'THB',
    unit: '1바트 기준',
    rate: '37.2',
    change: '▲ 0.2%',
    isUp: true,
    region: '아시아',
  },
  {
    country: '중국 위안',
    code: 'CNY',
    unit: '1위안 기준',
    rate: '189.6',
    change: '▼ 0.3%',
    isUp: false,
    region: '아시아',
  },
  {
    country: '필리핀 페소',
    code: 'PHP',
    unit: '1페소 기준',
    rate: '24.1',
    change: '▲ 0.1%',
    isUp: true,
    region: '아시아',
  },
  {
    country: '인도네시아 루피아',
    code: 'IDR',
    unit: '1루피아 기준',
    rate: '0.084',
    change: '▼ 0.2%',
    isUp: false,
    region: '아시아',
  },
];

const TABS = ['전체', '즐겨찾기', '아시아', '미주'] as const;
type Tab = (typeof TABS)[number];

export default function ExchangeRateFullPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('전체');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = (code: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const filtered = ALL_RATES.filter((item) => {
    if (activeTab === '즐겨찾기') return favorites.has(item.code);
    if (activeTab === '아시아') return item.region === '아시아';
    if (activeTab === '미주') return item.region === '미주';
    return true;
  });

  return (
    <>
      <TopBar
        title="실시간 환율"
        onBack={() => navigate('/')}
        rightAction={
          <button className={styles.iconBtn} aria-label="새로고침">
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
        {filtered.length === 0 && <div className={styles.empty}>즐겨찾기한 통화가 없습니다</div>}
        {filtered.map((item) => (
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
        ))}
      </div>
    </>
  );
}
