import TopBar from '@/components/navigation/TopBar';
import { EXCHANGE_HISTORY_LIST_MOCK } from '@/mocks/mypageMock';
import styles from './ExchangeHistoryPage.module.css';

const HISTORY = EXCHANGE_HISTORY_LIST_MOCK.result;

export default function ExchangeHistoryPage() {
  return (
    <>
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
    </>
  );
}
