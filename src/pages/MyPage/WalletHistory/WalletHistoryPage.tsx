import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { WALLET_TRANSACTIONS_MOCK } from '@/mocks/mypageMock';
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

const TRANSACTIONS = WALLET_TRANSACTIONS_MOCK.result;

const matchesTab = (kind: WalletTransaction['kind'], tab: WalletTabKey) =>
  tab === 'all' || tab === kind;

export default function WalletHistoryPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<WalletTabKey>('all');
  const visible = TRANSACTIONS.filter((tx) => matchesTab(tx.kind, activeTab));

  const handleItemClick = (tx: WalletTransaction) => {
    if (tx.kind === 'send' && tx.receiptInfo) {
      navigate('/transfer/receipt', { state: tx.receiptInfo });
    }
  };

  return (
    <>
      <TopBar title="전자지갑" />

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
          <div
            key={tx.id}
            className={`${styles.item} ${tx.kind === 'send' && tx.receiptInfo ? styles.itemClickable : ''}`}
            onClick={() => handleItemClick(tx)}
          >
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
    </>
  );
}
