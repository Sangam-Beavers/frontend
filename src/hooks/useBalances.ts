import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { walletApi, type WalletBalancesResponse } from '@/api/wallet';

/**
 * 내 전자지갑 잔액 조회 hook (api-spec — wallet-service WalletController.getMyBalances).
 *
 * <p>잔액·송금가능액은 항상 최신을 보여야 하므로 staleTime=0 (api/README.md §2 가이드).
 *
 * <p>지갑이 없으면(WALLET4001) error 상태가 된다. 화면에서 분기해 "지갑 생성 필요" 안내
 * 또는 모든 통화를 0으로 fallback 처리.
 *
 * @example
 *   const { data, isLoading, error } = useBalances();
 *   const krw = balanceOf(data, 'KRW'); // string ("1530000.0000")
 */
export const useBalances = () =>
  useQuery<WalletBalancesResponse>({
    queryKey: ['wallet', 'balances'],
    queryFn: () => walletApi.getBalances(),
    staleTime: 0,
    // 잔액 없음(WALLET4001)은 비즈니스 에러라 재시도 무의미 — 1회만.
    retry: (failureCount, err) => {
      if (err instanceof ApiException && err.code === 'WALLET4001') return false;
      return failureCount < 2;
    },
  });

/**
 * balances 배열에서 특정 통화 잔액을 안전하게 꺼내는 helper.
 *
 * <p>매칭 없으면 "0.0000" 반환 (Number 변환 시 0). data 자체가 undefined여도 같은 fallback.
 * 호출 측에서는 Number(balanceOf(data, 'KRW')).toLocaleString() 패턴으로 표시한다.
 */
export function balanceOf(data: WalletBalancesResponse | undefined, currencyCode: string): string {
  return data?.balances.find((b) => b.currency_code === currencyCode)?.balance ?? '0.0000';
}
