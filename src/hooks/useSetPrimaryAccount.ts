import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet';

/**
 * 주 계좌 변경 hook (api-spec — wallet-service AccountController.changePrimary).
 *
 * <p>성공 시 ['wallet','accounts']를 invalidate해 목록 정렬(주 계좌 우선)과 is_primary 값을
 * 서버 기준으로 갱신한다. 이미 주 계좌인 계좌를 다시 지정해도 멱등 성공이라 별도 분기 불필요.
 *
 * <p>존재하지 않는 계좌(미존재/타인/비활성) ACCOUNT4001(404),
 * 분산락 실패 COMMON5031(503) → ApiException으로 throw → 호출 측은
 * {@link import('@/utils/accountErrorMessage').accountErrorMessage}로 메시지 변환.
 * 인증 누락(AUTH4011)은 apiClient interceptor가 로그인 화면으로 이동.
 *
 * @example
 *   const setPrimary = useSetPrimaryAccount();
 *   setPrimary.mutate(accountId, {
 *     onSuccess: () => toast('주 계좌로 지정되었습니다.'),
 *     onError: (e) => toast(accountErrorMessage(e), 'error'),
 *   });
 */
export const useSetPrimaryAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => walletApi.setPrimaryAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'accounts'] });
    },
  });
};
