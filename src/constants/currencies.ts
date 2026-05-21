export interface ForeignCurrency {
  code: string;
  label: string;
  symbol: string;
}

export interface TransferCurrency {
  code: string;
  label: string;
}

// 환전(Exchange): 외화 통화 옵션
export const FOREIGN_CURRENCIES: ForeignCurrency[] = [
  { code: 'USD', label: '달러', symbol: '$' },
  { code: 'VND', label: '동', symbol: '₫' },
  { code: 'THB', label: '바트', symbol: '฿' },
  { code: 'CNY', label: '위안', symbol: '¥' },
];

// 송금(Transfer): 통화 선택 옵션
export const TRANSFER_CURRENCIES: TransferCurrency[] = [
  { code: 'VND', label: '베트남 동' },
  { code: 'KRW', label: '원화' },
  { code: 'USD', label: '달러' },
  { code: 'THB', label: '바트' },
  { code: 'CNY', label: '위안' },
];
