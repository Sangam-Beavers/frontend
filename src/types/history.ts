export type WalletTxKind = 'charge' | 'send' | 'receive';
export type WalletTabKey = 'all' | 'charge' | 'send' | 'receive';

export interface WalletTransaction {
  id: string;
  kind: WalletTxKind;
  title: string;
  meta: string;
  amountDisplay: string;
  isOutgoing: boolean;
}

export interface ExchangeTransaction {
  id: string;
  fromTo: string;
  meta: string;
  dateLabel: string;
}

export type DocAnalysisStatus = 'ok' | 'warning' | 'danger' | 'locked';

export interface DocAnalysisEntry {
  id: string;
  title: string;
  meta: string;
  status: DocAnalysisStatus;
}
