import { useQuery } from '@tanstack/react-query';
import { walletApi, type ExchangeRateWidgetResponse } from '@/api/wallet';

/**
 * 주요 통화 환율 위젯 조회 hook (GET /wallets/exchange-rates).
 *
 * <p>홈 화면 "실시간 환율" 가로 카드용. KRW 기준 "1 외화→KRW" 환율 + 등락률.
 *
 * <p>staleTime 5분 — 환율은 dev 환경에선 Mock 고정값, prod에선 일배치(매일 자정 갱신)라
 * 자주 fetch할 필요 없음 (api/README.md §2 staleTime 가이드).
 *
 * @param currencyCodes 조회 통화 콤마 구분 (예: "USD,PHP,VND"). 생략 시 KRW 제외 전체.
 */
export const useExchangeRatesWidget = (currencyCodes?: string) =>
  useQuery<ExchangeRateWidgetResponse>({
    queryKey: ['wallet', 'exchange-rates', currencyCodes ?? 'ALL'],
    queryFn: () => walletApi.getExchangeRatesWidget(currencyCodes),
    staleTime: 5 * 60_000,
  });
