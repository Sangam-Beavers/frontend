export interface CurrencyChip {
  code: string;
  displayAmount: string;
}

export interface ExchangeRate {
  country: string;
  code: string;
  rate: string;
  change: string;
  isUp: boolean;
}

export interface NotificationCard {
  id: string;
  title: string;
  description: string;
}

export interface NavItem {
  icon: string;
  label: string;
  path: string;
}
