export interface RateInfo {
  rate: number;
  display: string;
}

// KRW → 외화: rate는 외화 1단위당 KRW의 역수 (계산용)
export const EXCHANGE_RATES_FORM_MOCK = {
  isSuccess: true,
  code: '200',
  result: {
    USD: { rate: 1 / 1380, display: '1 USD = ₩1,380' },
    VND: { rate: 1 / 18.5, display: '1 VND = ₩0.054' },
    THB: { rate: 1 / 38.5, display: '1 THB = ₩38.5' },
    CNY: { rate: 1 / 192, display: '1 CNY = ₩192' },
  } as Record<string, RateInfo>,
};

// 외화 → KRW (재환전): rate는 외화 1단위당 KRW
export const EXCHANGE_RATES_REVERSE_MOCK = {
  isSuccess: true,
  code: '200',
  result: {
    USD: { rate: 1370, display: '1 USD = ₩1,370' },
    VND: { rate: 0.054, display: '1 VND = ₩0.054' },
    THB: { rate: 38.5, display: '1 THB = ₩38.5' },
    CNY: { rate: 192, display: '1 CNY = ₩192' },
  } as Record<string, RateInfo>,
};
