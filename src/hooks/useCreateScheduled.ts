import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  walletApi,
  type CreateScheduledTransferRequest,
  type ScheduledTransferResponse,
} from '@/api/wallet';

/**
 * 정기 송금 설정 mutation hook (POST /transfers/scheduled).
 *
 * <p>검증 통과({@code useValidateScheduled.is_valid=true}) 후 호출. 성공 시 목록 캐시
 * {@code ['wallet','scheduled-transfers']}를 invalidate해 RecurringList가 새 항목을 즉시 반영.
 *
 * <p>등록 시점에 송금이 즉시 일어나지 않는다 — 스케줄러가 next_run_date에 자동 실행.
 * 에러는 ApiException으로 throw되어 onError에서 분기 (COMMON4001/COMMON4221/MEMBER4001 등).
 *
 * @example
 *   const create = useCreateScheduled();
 *   create.mutate(body, {
 *     onSuccess: (res) => navigate('/recurring/complete', { state: res }),
 *     onError: (err) => alert(err.message),
 *   });
 */
export const useCreateScheduled = () => {
  const queryClient = useQueryClient();
  return useMutation<ScheduledTransferResponse, Error, CreateScheduledTransferRequest>({
    mutationFn: (body) => walletApi.createScheduled(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'scheduled-transfers'] });
    },
  });
};
