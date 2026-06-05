import { useQuery } from '@tanstack/react-query';
import { memberApi, type ProfileResponse } from '@/api/member';

/**
 * 내 프로필 조회 hook (api-spec §8).
 *
 * <p>인증 필요(JWT) — 호출 측은 ProtectedRoute 안의 페이지에서만 사용.
 * 토큰 부착은 apiClient interceptor가 자동.
 *
 * <p>staleTime 5분 — 프로필은 자주 안 바뀌므로 같은 화면 재진입 시 재요청 회피.
 * 수정(PATCH /me) 이후엔 호출 측에서 queryClient.invalidateQueries(['member','me'])로 무효화.
 *
 * @example
 *   const { data, isLoading, error } = useMyProfile();
 */
export const useMyProfile = () =>
  useQuery<ProfileResponse>({
    queryKey: ['member', 'me'],
    queryFn: () => memberApi.getMyProfile(),
    staleTime: 5 * 60_000,
  });
