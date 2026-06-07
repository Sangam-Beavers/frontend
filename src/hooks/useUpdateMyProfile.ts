import { useMutation, useQueryClient } from '@tanstack/react-query';
import { memberApi, type ProfileResponse, type ProfileUpdateBody } from '@/api/member';

/**
 * 내 프로필 수정 mutation hook (api-spec §9 — PATCH /api/v1/members/me).
 *
 * <p>호출 측은 닉네임/언어(BCP 47)/자기소개를 모두 채워 한 번에 전송한다(백엔드 모든 필드 @NotBlank).
 * 성공 시 백엔드가 갱신된 ProfileResponse를 반환 — 캐시 ['member','me']를 invalidate해
 * 마이페이지/프로필 화면이 새 값으로 다시 그려지게 한다.
 *
 * <p>에러는 ApiException으로 throw되어 호출 측 onError에서 분기:
 * - 400 COMMON4001 — 형식/필수 검증 실패
 * - 401 AUTH4011 — apiClient interceptor가 로그인 화면으로 자동 이동(여기 onError 도달 X)
 * - 404 MEMBER4001 — 회원 없음(거의 발생 안 함, 토큰 정합성 깨진 경우)
 * - 409 MEMBER4003 — 닉네임 중복(사전 checkNickname 통과해도 race에서 발생 가능)
 *
 * @example
 *   const update = useUpdateMyProfile();
 *   update.mutate({ nickname, language: 'ko', bio });
 */
export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation<ProfileResponse, Error, ProfileUpdateBody>({
    mutationFn: (body) => memberApi.updateMyProfile(body),
    onSuccess: () => {
      // 갱신된 ProfileResponse가 응답으로 오지만, 다른 화면에서도 캐시를 공유하므로
      // setQueryData 직접 갱신보다 invalidate로 일관 동기화한다(useMyProfile은 staleTime 5분).
      queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
    },
  });
};
