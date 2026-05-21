import type { NextScheduledTransfer, RecurringTransfer } from '@/types/recurring';

export const RECURRING_TRANSFERS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
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
  ] as RecurringTransfer[],
};

export const NEXT_SCHEDULED_MOCK = {
  isSuccess: true,
  code: '200',
  result: {
    scheduledAt: '2026.06.25 09:00',
    recipientName: 'Linh',
    amountDisplay: 'VND ₫1,200,000',
  } as NextScheduledTransfer,
};
