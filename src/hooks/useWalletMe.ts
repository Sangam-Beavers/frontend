import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { walletApi, type WalletMeResponse } from '@/api/wallet';

/**
 * 내 전자지갑 + 원화 환산 총액 조회 hook (GET /wallets/me).
 *
 * <p>홈 화면 "지금 나의 원화" 카드용. total_balance_in_krw가 핵심 표시값.
 *
 * <p>staleTime 30초 — 잔액·환율 모두 자주 안 바뀌어 매번 fetch는 과함.
 * 환전·송금 직후 갱신은 React Query가 페이지 진입 시 background refetch로 처리.
 *
 * <p>WALLET4001(지갑 없음)은 비즈니스 에러라 재시도 무의미 — 1회만.
 *
 * @example
 *   const { data, isLoading, error } = useWalletMe();
 *   const total = Number(data?.total_balance_in_krw ?? 0);
 */
export const useWalletMe = () =>
  useQuery<WalletMeResponse>({
    queryKey: ['wallet', 'me'],
    queryFn: () => walletApi.getWalletMe(),
    staleTime: 30_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiException && err.code === 'WALLET4001') return false;
      return failureCount < 2;
    },
  });
