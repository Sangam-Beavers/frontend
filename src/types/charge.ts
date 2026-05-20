export interface BankAccount {
  id: string;
  bankName: string;
  maskedNumber: string;
  isPrimary?: boolean;
}

export interface AuthStep {
  index: number;
  label: string;
  done: boolean;
}
