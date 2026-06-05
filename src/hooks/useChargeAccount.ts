import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet';

/** 충전 파라미터 — 출금 계좌 id + 금액(string) + 멱등키. */
export interface ChargeParams {
  accountId: string;
  /** KRW 십진수 string. 0 초과. */
  amount: string;
  /** (계좌, 금액) 단위로 한 번 생성해 재시도 시 동일 키 전달(멱등성). */
  idempotencyKey: string;
}

/**
 * 충전 금액 검증·실행 hook (api-spec — wallet-service AccountController.charge).
 *
 * <p>성공 시 잔액이 바뀌므로 ['wallet','balances']를 invalidate → 홈·충전 화면 잔액이 자동 갱신된다.
 * 멱등성 보장을 위해 호출 측이 idempotencyKey를 관리한다(자동 재시도 금지 — 중복 충전 위험).
 *
 * <p>한도 초과(ACCOUNT4007)·연동 계좌 잔액 부족(ACCOUNT4003) 등은 ApiException으로 throw —
 * 호출 측에서 accountErrorMessage로 매핑.
 *
 * @example
 *   const charge = useChargeAccount();
 *   charge.mutate({ accountId, amount: '300000', idempotencyKey });
 */
export const useChargeAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, amount, idempotencyKey }: ChargeParams) =>
      walletApi.chargeAccount(accountId, { amount }, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balances'] });
    },
  });
};
