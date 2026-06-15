import { useQuery } from '@tanstack/react-query';
import { walletApi, type WalletSecuritySummaryResponse } from '@/api/wallet';

/**
 * 전자지갑 보안 점검 hook (GET /wallets/me/security-summary).
 *
 * <p>홈 "이상거래 탐지" 카드 + 보안 점검 상세 화면용. 최근 거래를 규칙 기반으로 점검한 요약을 받는다.
 *
 * <p>staleTime 60초 — 보안 상태는 실시간일 필요는 없으나, 화면을 오갈 때 background refetch로 갱신된다.
 */
export const useSecuritySummary = () =>
  useQuery<WalletSecuritySummaryResponse>({
    queryKey: ['wallet', 'security-summary'],
    queryFn: () => walletApi.getSecuritySummary(),
    staleTime: 60_000,
  });
