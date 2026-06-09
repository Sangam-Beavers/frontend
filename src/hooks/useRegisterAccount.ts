import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { walletApi, type RegisterAccountRequest } from '@/api/wallet';

/**
 * 계좌 등록 최종 완료 hook (api-spec — wallet-service AccountController.registerAccount).
 *
 * <p>1원 인증(confirm) 완료 후 서버가 Redis에 보관한 account_token을 서버가 직접 소비해 계좌를 등록한다.
 * 성공 시 등록된 계좌 목록 ['wallet','accounts']를 invalidate → 계좌관리·충전·계좌송금 화면이 자동으로 새 계좌를 반영한다.
 *
 * <p>세션 없음/만료(ACCOUNT4009), 이미 등록된 계좌(ACCOUNT4004) 등은 ApiException으로 throw.
 *
 * @example
 *   const register = useRegisterAccount();
 *   register.mutate(
 *     { bank_code, account_number, holder_name },
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
