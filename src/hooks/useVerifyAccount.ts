import { useMutation } from '@tanstack/react-query';
import { walletApi, type VerifyAccountRequest } from '@/api/wallet';

/**
 * 1원 소액이체 인증 시작 hook (api-spec — wallet-service AccountController.verifyAccount).
 *
 * <p>자동이체 인증 화면에서 "인증 시작"을 누를 때 호출. 은행이 1원을 입금하고
 * pending/expires_at을 반환한다. 이후 useConfirmAccount로 코드 검증이 필요하다.
 * 인증 요청 횟수 rate-limit(ACCOUNT4005)이 있어 자동 재시도하지 않는다.
 *
 * @example
 *   const verify = useVerifyAccount();
 *   verify.mutate({ bank_code, account_number, holder_name });
 *   verify.data?.expires_at; // 만료 시각
 */
export const useVerifyAccount = () =>
  useMutation({
    mutationFn: (body: VerifyAccountRequest) => walletApi.verifyAccount(body),
  });
