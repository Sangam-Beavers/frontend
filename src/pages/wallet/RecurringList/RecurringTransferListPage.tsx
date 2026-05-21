import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { NEXT_SCHEDULED_MOCK, RECURRING_TRANSFERS_MOCK } from '@/mocks/recurringMock';
import type { RecurringTransfer } from '@/types/recurring';
import styles from './RecurringTransferListPage.module.css';

const TRANSFERS = RECURRING_TRANSFERS_MOCK.result;
const NEXT_SCHEDULED = NEXT_SCHEDULED_MOCK.result;

const formatStatus = (status: RecurringTransfer['status']) =>
  status === 'active' ? '활성' : '일시정지';

export default function RecurringTransferListPage() {
  const navigate = useNavigate();

  return (
    <>
      <TopBar title="정기 송금 내역" />

      <div className={styles.list}>
        {TRANSFERS.map((transfer) => (
          <button
            key={transfer.id}
            type="button"
            className={styles.item}
            onClick={() => navigate('/recurring/setup')}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{transfer.title}</div>
              <div className={styles.itemMeta}>
                {transfer.scheduleLabel} · {transfer.amountDisplay} ·{' '}
                {formatStatus(transfer.status)}
              </div>
            </div>
            <span className={styles.pill}>관리</span>
          </button>
        ))}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/recurring/setup')}>
        새 정기 송금 만들기
      </button>

      <div className={styles.card}>
        <div className={styles.cardTitle}>다음 예정 송금</div>
        <div className={styles.cardText}>
          {NEXT_SCHEDULED.scheduledAt} · {NEXT_SCHEDULED.recipientName} ·{' '}
          {NEXT_SCHEDULED.amountDisplay}
        </div>
      </div>
    </>
  );
}
