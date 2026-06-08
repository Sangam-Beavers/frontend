import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { walletApi, type ScheduledTransferHistoryResponse } from '@/api/wallet';

/**
 * 정기 송금 회차 이력 조회 hook (GET /transfers/scheduled/{id}/history).
 *
 * <p>RecurringTransferHistoryPage에서 사용. publicId가 빈 값이면 호출 안 함(enabled false).
 * keepPreviousData로 페이지 전환 시 화면 깜빡임 회피.
 *
 * <p>staleTime 30초 — 스케줄러가 cron으로 새 회차를 추가할 수 있어 너무 길게 두지 않는다.
 *
 * @example
 *   const { transferPublicId = '' } = useParams();
 *   const { data, isLoading, isFetching, error } = useScheduledHistory(transferPublicId);
 */
export const useScheduledHistory = (transferPublicId: string, page = 0, size = 20) =>
  useQuery<ScheduledTransferHistoryResponse>({
    queryKey: ['wallet', 'scheduled-history', transferPublicId, { page, size }],
    queryFn: () => walletApi.getScheduledHistory(transferPublicId, page, size),
    enabled: Boolean(transferPublicId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
