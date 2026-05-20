export type RecurringStatus = 'active' | 'paused';

export interface RecurringTransfer {
  id: string;
  title: string;
  scheduleLabel: string;
  amountDisplay: string;
  status: RecurringStatus;
}

export interface NextScheduledTransfer {
  scheduledAt: string;
  recipientName: string;
  amountDisplay: string;
}
