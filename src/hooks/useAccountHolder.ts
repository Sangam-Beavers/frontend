import { useMutation } from '@tanstack/react-query';
import { walletApi } from '@/api/wallet';

/** 예금주 조회 파라미터 — 은행 코드 + (하이픈 없는) 계좌번호. */
export interface AccountHolderParams {
  bankCode: string;
  accountNumber: string;
}

/**
 * 예금주 실명 조회 hook (api-spec — wallet-service AccountController.getAccountHolder).
 *
 * <p>읽기 전용 GET이지만 "사용자가 버튼을 누를 때만" 실행하는 온디맨드 조회라 useMutation으로 모델링한다.
 * 조회 횟수 rate-limit(COMMON4291, 429)이 있어 자동 호출/재시도는 금지 — 명시적 트리거 전용.
 *
 * <p>에러는 ApiException으로 throw되며 code로 분기(존재X ACCOUNT4001 / 형식오류 COMMON4001 /
 * 횟수초과 COMMON4291 / 은행장애 COMMON5031). 호출 측에서 사용자 메시지로 매핑한다.
 *
 * @example
 *   const holder = useAccountHolder();
 *   holder.mutate({ bankCode, accountNumber });
 *   holder.data?.account_holder_name; // "홍길동"
 */
export const useAccountHolder = () =>
  useMutation({
    mutationFn: ({ bankCode, accountNumber }: AccountHolderParams) =>
      walletApi.getAccountHolder(bankCode, accountNumber),
  });
