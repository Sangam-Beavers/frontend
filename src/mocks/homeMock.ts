import type { CurrencyChip, CurrencyOption, ExchangeRate, NotificationCard } from '@/types/home';

export const HOME_CURRENCIES_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { code: 'USD', displayAmount: 'USD $240.50' },
    { code: 'VND', displayAmount: 'VND ₫1,200,000' },
  ] as CurrencyChip[],
};

export const HOME_EXCHANGE_RATES_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { country: '미국', code: 'USD', rate: '1,370', change: '▲ 0.4%', isUp: true },
    { country: '베트남', code: 'VND', rate: '0.054', change: '▼ 0.1%', isUp: false },
    { country: '태국', code: 'THB', rate: '37.2', change: '▲ 0.2%', isUp: true },
  ] as ExchangeRate[],
};

export const HOME_NOTIFICATIONS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { id: 'fraud', title: '이상거래 탐지', description: '현재 전자지갑은 안전합니다.' },
    { id: 'legal', title: '변호사 상담', description: '근로계약서 확인 상담을 받아보세요.' },
  ] as NotificationCard[],
};

export const HOME_ALL_CURRENCIES_MOCK: CurrencyOption[] = [
  { code: 'USD', label: '미국 달러', displayAmount: 'USD $240.50' },
  { code: 'VND', label: '베트남 동', displayAmount: 'VND ₫1,200,000' },
  { code: 'THB', label: '태국 바트', displayAmount: 'THB ฿6,820' },
  { code: 'CNY', label: '중국 위안', displayAmount: 'CNY ¥1,740' },
  { code: 'JPY', label: '일본 엔', displayAmount: 'JPY ¥24,300' },
  { code: 'EUR', label: '유로', displayAmount: 'EUR €174.50' },
  { code: 'PHP', label: '필리핀 페소', displayAmount: 'PHP ₱14,200' },
];

export const HOME_WALLET_BALANCE_MOCK = {
  isSuccess: true,
  code: '200',
  result: 1_250_000,
};
