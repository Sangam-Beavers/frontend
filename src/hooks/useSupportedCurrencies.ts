import { useQuery } from '@tanstack/react-query';
import { walletApi, type SupportedCurrenciesResponse } from '@/api/wallet';

/**
 * 환전·재환전 지원 통화 목록 조회 hook (api-spec §9).
 *
 * <p>마스터성 데이터(현재 KRW/USD/PHP/VND 4종)라 자주 안 바뀐다 — staleTime 5분으로
 * 캐싱해 Select/Form/Reverse 페이지가 같은 데이터를 공유한다 (api/README.md §2 staleTime 가이드).
 * 인증 필요(JWT).
 *
 * @example
 *   const { data, isLoading, error } = useSupportedCurrencies();
 *   const foreign = data?.currencies.filter(c => c.currency_code !== 'KRW') ?? [];
 */
export const useSupportedCurrencies = () =>
  useQuery<SupportedCurrenciesResponse>({
    queryKey: ['wallet', 'supported-currencies'],
    queryFn: () => walletApi.getSupportedCurrencies(),
    staleTime: 5 * 60_000, // 5분
  });
