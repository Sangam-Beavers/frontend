import { useQuery } from '@tanstack/react-query';
import { walletApi, type RecentRemittanceAccountsResponse } from '@/api/wallet';

/**
 * 최근 송금한 외부 계좌 목록 — TransferBank 화면 "최근 송금한 계좌" 섹션.
 *
 * GET /api/v1/transfers/recent-accounts
 *
 * - staleTime 30s: 송금 직후 다시 들어오는 흐름까지 캐시 활용. 송금 화면 진입 빈도 낮아 충분.
 * - WALLET4001(지갑 없음)은 호출 측에서 ApiException으로 받아 섹션 자체를 숨김.
 *
 * @param size 조회 건수 (1~50). 미지정 시 기본 10 (백엔드 기본값).
 */
export const useRecentRemittanceAccounts = (size?: number) =>
  useQuery<RecentRemittanceAccountsResponse>({
    queryKey: ['wallet', 'recent-remittance-accounts', { size }],
    queryFn: () => walletApi.getRecentRemittanceAccounts(size),
    staleTime: 30_000,
  });
