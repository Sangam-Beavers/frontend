import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { walletApi, type RegisterAccountRequest } from '@/api/wallet';

/**
 * 계좌 등록 최종 완료 hook (api-spec — wallet-service AccountController.registerAccount).
 *
 * <p>verify에서 받은 account_token으로 계좌를 등록한다. 성공 시 등록된 계좌 목록
 * ['wallet','accounts']를 invalidate → 계좌관리·충전·계좌송금 화면이 자동으로 새 계좌를 반영한다.
 *
 * <p>이미 등록된 계좌(ACCOUNT4004) 등은 ApiException으로 throw — 호출 측에서 code별 메시지 매핑.
 *
 * @example
 *   const register = useRegisterAccount();
 *   register.mutate(
 *     { bank_code, account_number, account_token, holder_name },
 *     { onSuccess: (acc) => navigate('/charge/account-registered', { state: acc }) }
 *   );
 */
export const useRegisterAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterAccountRequest) => walletApi.registerAccount(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'accounts'] });
    },
    onError: (err) => {
      // 이미 등록된 계좌(409) — 서버엔 존재하므로 목록 캐시를 무효화해 최신 상태로 맞춘다.
      if (err instanceof ApiException && err.code === 'ACCOUNT4004') {
        queryClient.invalidateQueries({ queryKey: ['wallet', 'accounts'] });
      }
    },
  });
};
