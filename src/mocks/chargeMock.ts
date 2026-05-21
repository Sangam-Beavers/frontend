import type { BankAccount } from '@/types/charge';

export interface ManagedAccount {
  bank: string;
  number: string;
  isPrimary: boolean;
}

export const CHARGE_ACCOUNTS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { id: 'kb', bankName: '국민은행', maskedNumber: '123-****-7890', isPrimary: true },
  ] as BankAccount[],
};

export const MANAGE_ACCOUNTS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { bank: '국민은행', number: '123-****-7890', isPrimary: true },
    { bank: '우리은행', number: '222-****-1111', isPrimary: false },
  ] as ManagedAccount[],
};
