import { useQuery } from '@tanstack/react-query';
import { walletApi, type RecentRecipientsResponse } from '@/api/wallet';

/**
 * 최근 송금한 앱 사용자 조회 hook (GET /transfers/recent-recipients/members).
 *
 * <p>TransferApp 화면 상단 "최근 송금" 칩용. 수신자별 최신 송금 1건씩 최근순.
 *
 * <p>staleTime 30초 — 송금 직후 새로 진입했을 때 너무 오래 캐시되지 않게 적당히.
 * 신규 사용자는 빈 배열 응답 — 화면에서 빈 상태 안내.
 *
 * @example
 *   const { data, isLoading, error, refetch } = useRecentInternalRecipients();
 *   const receivers = data?.receivers ?? [];
 */
export const useRecentInternalRecipients = () =>
  useQuery<RecentRecipientsResponse>({
    queryKey: ['wallet', 'recent-recipients', 'members'],
    queryFn: () => walletApi.getRecentInternalRecipients(),
    staleTime: 30_000,
  });
