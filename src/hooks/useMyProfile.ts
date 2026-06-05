import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { memberApi, type ProfileResponse } from '@/api/member';

/**
 * 내 프로필 조회 hook (api-spec §8 + 이슈 #108 가드 SSOT).
 *
 * <p>마이페이지 표시(#91) + 이슈 #108의 신분증 인증 여부 가드(VerifiedRoute/HomePage 잠금)에서
 * 같이 사용한다. {@code is_verified}가 미인증이면 금융 라우트 진입이 차단된다.
 *
 * <p>인증 필요(JWT) — 호출 측은 ProtectedRoute 안의 페이지에서만 사용.
 * 토큰 부착은 apiClient interceptor가 자동.
 *
 * <p>staleTime 5분 — 인증 상태/프로필은 자주 안 바뀌므로 같은 화면 재진입 시 재요청 회피.
 * 수정(PATCH /me)이나 신분증 인증 직후엔 호출 측에서
 * {@code queryClient.invalidateQueries(['member','me'])} 또는 {@code refetchQueries}로 무효화한다.
 *
 * <p>회원 미존재(404 MEMBER4001)는 비즈니스 에러라 재시도 무의미 — 1회만.
 *
 * @example
 *   const { data, isLoading, error } = useMyProfile();
 *   const verified = data?.is_verified ?? false;
 */
export const useMyProfile = () =>
  useQuery<ProfileResponse>({
    queryKey: ['member', 'me'],
    queryFn: () => memberApi.getMyProfile(),
    staleTime: 5 * 60_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiException && err.code === 'MEMBER4001') return false;
      return failureCount < 2;
    },
  });
