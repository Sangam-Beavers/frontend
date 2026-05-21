import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { NextScheduledTransfer, RecurringTransfer } from '@/types/recurring';
import styles from './RecurringTransferListPage.module.css';

const TRANSFERS: RecurringTransfer[] = [
  {
    id: 'linh-monthly',
    title: 'Linh에게 매월 송금',
    scheduleLabel: '매월 25일',
    amountDisplay: 'VND ₫1,200,000',
    status: 'active',
  },
  {
    id: 'family-living',
    title: '가족 생활비 송금',
    scheduleLabel: '매월 1일',
    amountDisplay: 'USD $100',
    status: 'paused',
  },
];

const NEXT_SCHEDULED: NextScheduledTransfer = {
  scheduledAt: '2026.06.25 09:00',
  recipientName: 'Linh',
  amountDisplay: 'VND ₫1,200,000',
};

const formatStatus = (status: RecurringTransfer['status']) =>
  status === 'active' ? '활성' : '일시정지';

export default function RecurringTransferListPage() {
  const navigate = useNavigate();

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={0} />}>
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
    </MobileScreen>
  );
}
