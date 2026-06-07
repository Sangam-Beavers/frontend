import { useQuery } from '@tanstack/react-query';
import {
  walletApi,
  type ScheduledTransferListResponse,
  type ScheduledTransferStatus,
} from '@/api/wallet';

/**
 * 정기송금 목록 조회 hook (GET /transfers/scheduled).
 *
 * <p>RecurringList 페이지용. status로 ACTIVE/PAUSED/CANCELLED 필터 가능 (미지정 시 전체).
 * staleTime 30초 — 사용자가 정기송금 설정/취소 직후 다시 진입했을 때 자동 갱신.
 *
 * @example
 *   const { data, isLoading, error } = useScheduledTransfers();      // 전체
 *   const { data } = useScheduledTransfers('ACTIVE');               // 활성만
 */
export const useScheduledTransfers = (status?: ScheduledTransferStatus, page = 0, size = 20) =>
  useQuery<ScheduledTransferListResponse>({
    queryKey: ['wallet', 'scheduled-transfers', { status, page, size }],
    queryFn: () => walletApi.getScheduledTransfers(status, page, size),
    staleTime: 30_000,
  });
