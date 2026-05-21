import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { ExchangeTransaction } from '@/types/history';
import styles from './ExchangeHistoryPage.module.css';

const HISTORY: ExchangeTransaction[] = [
  {
    id: 'ex-1',
    fromTo: 'KRW → USD',
    meta: '₩100,000 → $72.45 · 환율 1,380',
    dateLabel: '05.15',
  },
  {
    id: 'ex-2',
    fromTo: 'USD → KRW',
    meta: '$100 → ₩136,000 · 재환전',
    dateLabel: '05.14',
  },
];

export default function ExchangeHistoryPage() {
  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={3} />}>
      <TopBar title="환전 내역" />

      <div className={styles.list}>
        {HISTORY.map((tx) => (
          <div key={tx.id} className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{tx.fromTo}</div>
              <div className={styles.itemMeta}>{tx.meta}</div>
            </div>
            <span className={styles.date}>{tx.dateLabel}</span>
          </div>
        ))}
      </div>
    </MobileScreen>
  );
}
