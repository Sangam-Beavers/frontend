import { useMutation } from '@tanstack/react-query';
import { walletApi, type ValidateMemberResponse } from '@/api/wallet';

/**
 * 앱 사용자 유효성 검증 mutation (GET /transfers/validate-member).
 *
 * <p>useQuery 대신 useMutation을 쓰는 이유: 사용자가 "확인" 버튼을 명시적으로 누를 때만
 * 1회 호출하는 액션이고, 결과 캐싱이 의미 없음(이메일은 입력값이 바뀌면 새 호출).
 *
 * <p>호출 측 패턴:
 * @example
 *   const { mutate, isPending, error, data } = useValidateMember();
 *   const onClickVerify = () => mutate('linh@example.com', {
 *     onSuccess: (res) => setVerified(res),
 *     onError: (e) => alert(e.message),
 *   });
 */
export const useValidateMember = () =>
  useMutation<ValidateMemberResponse, Error, string>({
    mutationFn: (email: string) => walletApi.validateMember(email),
  });
