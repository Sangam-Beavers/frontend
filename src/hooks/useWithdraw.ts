import { useMutation } from '@tanstack/react-query';
import { memberApi } from '@/api/member';

/**
 * 회원 탈퇴 hook (api-spec — member-service MemberMeController.withdraw).
 *
 * <p>성공 시 호출 측에서 토큰 정리 + Authentik end_session 호출(`startLogout`)을 해야
 * IdP 세션까지 끊긴다. 단순 로컬 redirect만 하면 "다시 로그인" 누를 때 IdP가 자동 통과시켜
 * 사용자가 "탈퇴 안 됨"으로 체감한다.
 *
 * <p>IdP 연동 실패(500 COMMON5000)는 백엔드 로컬도 변경되지 않은 상태라 재시도 가능.
 * 인증 누락(401 AUTH4011)은 interceptor가 자동 처리하지만, 이미 토큰 만료 가능성 있음.
 *
 * @example
 *   const withdraw = useWithdraw();
 *   withdraw.mutate(undefined, {
 *     onSuccess: () => startLogout(), // 토큰 정리 + IdP 세션 종료 + /login 이동
 *     onError: () => toast('탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.', 'error'),
 *   });
 */
export const useWithdraw = () =>
  useMutation({
    mutationFn: () => memberApi.withdraw(),
  });
