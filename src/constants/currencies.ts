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

// 앱 지원 통화 (이슈 #194). 백엔드가 잔액을 주는 4개 통화 — 우리 서비스 국적과 1:1.
//   KRW(한국) / VND(베트남) / PHP(필리핀) / USD(미국). 표시 라벨은 i18n `home.currencies.{code}`.
// 홈 메인 카드의 메인 통화 선택·표시 통화 후보의 단일 출처(SSOT).
export const SUPPORTED_CURRENCIES = ['KRW', 'VND', 'PHP', 'USD'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

/** 통화 기호. 백엔드 응답엔 잔액(숫자)만 있어 클라이언트에서 보강한다. */
export const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  VND: '₫',
  PHP: '₱',
  USD: '$',
};

/** 코드가 지원 통화인지 검사(localStorage 등 외부 값 정제용). */
export function isSupportedCurrency(code: string): boolean {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code);
}
