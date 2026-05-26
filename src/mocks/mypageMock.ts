import type { DocAnalysisEntry, ExchangeTransaction, WalletTransaction } from '@/types/history';

export const WALLET_TRANSACTIONS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'tx-1',
      kind: 'send',
      title: '송금',
      meta: 'Linh · 2026.05.15 · 완료',
      amountDisplay: '-₫1,200,000',
      isOutgoing: true,
      receiptInfo: {
        recipient: 'Linh',
        amount: '₫1,200,000',
        txId: 'GB-20260515-00082',
        dateTime: '2026.05.15',
      },
    },
    {
      id: 'tx-2',
      kind: 'charge',
      title: '충전',
      meta: '국민은행 · 완료',
      amountDisplay: '+₩300,000',
      isOutgoing: false,
    },
  ] as WalletTransaction[],
};

export const EXCHANGE_HISTORY_LIST_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
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
  ] as ExchangeTransaction[],
};

export const DOC_ANALYSIS_ENTRIES_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { id: 'doc-1', title: '근로계약서', meta: '주의 필요 · 2026.05.13', status: 'warning' },
    { id: 'doc-locked', title: '잠긴 내역', meta: '구독 후 확인 가능', status: 'locked' },
  ] as DocAnalysisEntry[],
};
