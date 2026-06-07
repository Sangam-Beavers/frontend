import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet';

/**
 * 계좌 삭제 hook (api-spec — wallet-service AccountController.deleteAccount).
 *
 * <p>성공 시 ['wallet','accounts']를 invalidate해 목록을 서버 기준으로 갱신.
 * 주 계좌를 삭제하면 백엔드가 남은 활성 계좌 중 최근 등록 1건을 자동으로 주 계좌로 승격하므로,
 * 프론트는 별도 후처리 없이 invalidate만 하면 정렬·is_primary가 모두 갱신된다.
 *
 * <p>존재하지 않는 계좌(미존재/타인/이미 비활성) ACCOUNT4001(404),
 * 분산락 실패 COMMON5031(503) → ApiException으로 throw → 호출 측은
 * {@link import('@/utils/accountErrorMessage').accountErrorMessage}로 메시지 변환.
 * 인증 누락(AUTH4011)은 apiClient interceptor가 로그인 화면으로 이동.
 *
 * @example
 *   const del = useDeleteAccount();
 *   del.mutate(accountId, {
 *     onSuccess: () => toast('계좌가 해제되었습니다.'),
 *     onError: (e) => toast(accountErrorMessage(e), 'error'),
 *   });
 */
export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => walletApi.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'accounts'] });
    },
  });
};
