import { useMutation } from '@tanstack/react-query';
import { walletApi, type VerifyAccountRequest } from '@/api/wallet';

/**
 * 계좌 연결 + 자동이체 인증 요청 hook (api-spec — wallet-service AccountController.verifyAccount).
 *
 * <p>자동이체 인증 화면에서 "인증 요청"을 누를 때 호출. 성공 응답의 account_token을
 * 계좌 등록(useRegisterAccount)에 그대로 넘긴다. 인증 요청 횟수 rate-limit(ACCOUNT4005)이
 * 있어 자동 재시도하지 않는다 — 명시적 트리거 전용.
 *
 * @example
 *   const verify = useVerifyAccount();
 *   verify.mutate({ bank_code, account_number, holder_name });
 *   verify.data?.account_token;
 */
export const useVerifyAccount = () =>
  useMutation({
    mutationFn: (body: VerifyAccountRequest) => walletApi.verifyAccount(body),
  });
