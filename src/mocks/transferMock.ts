export type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad';

export interface RecentUser {
  initial: string;
  name: string;
  currency: string;
  tone: AvatarTone;
  email: string;
}

export interface RecentAccount {
  bank: string;
  holder: string;
  masked: string;
  lastAmount: string;
}

export const RECENT_USERS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { initial: 'L', name: 'Linh', currency: 'VND', tone: 'best', email: 'linh@email.com' },
    { initial: 'M', name: 'Minh', currency: 'USD', tone: 'good', email: 'minh@email.com' },
    { initial: 'A', name: 'Anna', currency: 'KRW', tone: 'mid', email: 'anna@email.com' },
  ] as RecentUser[],
};

export const RECENT_ACCOUNTS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { bank: '국민은행', holder: '김민수', masked: '123-****-1111', lastAmount: '₩200,000' },
  ] as RecentAccount[],
};
