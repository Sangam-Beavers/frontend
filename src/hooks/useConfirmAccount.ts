import { useMutation } from '@tanstack/react-query';
import { walletApi, type ConfirmAccountRequest } from '@/api/wallet';

/**
 * 1원 인증코드 확인 hook (api-spec — wallet-service AccountController.confirmAccount).
 *
 * <p>자동이체 인증 화면에서 사용자가 4자리 코드를 입력하고 "인증 확인"을 누를 때 호출.
 * 성공 시 서버가 account_token을 Redis에 보관하며, 이후 useRegisterAccount가 그 토큰을 소비한다.
 *
 * <p>코드 불일치(ACCOUNT4008), 세션 만료/없음(ACCOUNT4009) 에러는 자동 재시도하지 않는다.
 *
 * @example
 *   const confirm = useConfirmAccount();
 *   confirm.mutate({ bank_code, account_number, code: '2814' });
 */
export const useConfirmAccount = () =>
  useMutation({
    mutationFn: (body: ConfirmAccountRequest) => walletApi.confirmAccount(body),
  });
