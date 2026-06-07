import { useMutation } from '@tanstack/react-query';
import {
  walletApi,
  type ValidateScheduledRequest,
  type ValidateScheduledResponse,
} from '@/api/wallet';

/**
 * 정기 송금 대상 유효성 검증 mutation hook (POST /transfers/scheduled/validate).
 *
 * <p>설정 직전 사전 검증용. 비즈니스 검증 실패(수신자 미존재, 잔액 부족 정책 위반 등)는 HTTP 200 +
 * {@code is_valid=false} + {@code reason}으로 표현되므로 호출 측은 onSuccess 안에서 응답을 봐야 한다.
 *
 * <p>형식 오류(amount 음수, currency 누락 등)는 백엔드가 400 COMMON4001을 던지므로 onError에서 처리.
 *
 * @example
 *   const validate = useValidateScheduled();
 *   validate.mutate(body, {
 *     onSuccess: (res) => {
 *       if (!res.is_valid) showError(res.reason ?? '검증 실패');
 *       else proceedToCreate();
 *     },
 *   });
 */
export const useValidateScheduled = () =>
  useMutation<ValidateScheduledResponse, Error, ValidateScheduledRequest>({
    mutationFn: (body) => walletApi.validateScheduled(body),
  });
