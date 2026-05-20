import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { WalletTabKey, WalletTransaction } from '@/types/history';
import styles from './WalletHistoryPage.module.css';

interface WalletTab {
  key: WalletTabKey;
  label: string;
}

const TABS: WalletTab[] = [
  { key: 'all', label: '전체' },
  { key: 'charge', label: '충전' },
  { key: 'send', label: '송금' },
  { key: 'receive', label: '받기' },
];

const TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx-1',
    kind: 'send',
    title: '송금',
    meta: 'Linh · 2026.05.15 · 완료',
    amountDisplay: '-₫1,200,000',
    isOutgoing: true,
  },
  {
    id: 'tx-2',
    kind: 'charge',
    title: '충전',
    meta: '국민은행 · 완료',
    amountDisplay: '+₩300,000',
    isOutgoing: false,
  },
];

const matchesTab = (kind: WalletTransaction['kind'], tab: WalletTabKey) =>
  tab === 'all' || tab === kind;

export default function WalletHistoryPage() {
  const [activeTab, setActiveTab] = useState<WalletTabKey>('all');
  const visible = TRANSACTIONS.filter((tx) => matchesTab(tx.kind, activeTab));

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={3} />}>
      <TopBar title="전자지갑 내역" />

      <div className={styles.tabs}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {visible.map((tx) => (
          <div key={tx.id} className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{tx.title}</div>
              <div className={styles.itemMeta}>{tx.meta}</div>
            </div>
            <b className={`${styles.amount} ${tx.isOutgoing ? styles.amountOut : styles.amountIn}`}>
              {tx.amountDisplay}
            </b>
          </div>
        ))}
      </div>
    </MobileScreen>
  );
}
