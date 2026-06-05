import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { memberApi, type MyProfileResult } from '@/api/member';

/**
 * 내 프로필 조회 hook (이슈 #108 — 신분증 인증 여부 가드 SSOT).
 *
 * <p>{@code is_verified} 값을 받아 `VerifiedRoute`/`HomePage`가 금융 기능 노출 여부를 결정한다.
 * 인증 상태는 자주 바뀌지 않으므로 staleTime 5분으로 캐싱한다(같은 세션에서 반복 조회 절감).
 *
 * <p>회원 미존재(404 MEMBER4001)는 비즈니스 에러라 재시도 무의미 — 1회만.
 *
 * @example
 *   const { data, isLoading } = useMyProfile();
 *   const verified = data?.is_verified ?? false;
 */
export const useMyProfile = () =>
  useQuery<MyProfileResult>({
    queryKey: ['member', 'me'],
    queryFn: () => memberApi.getMyProfile(),
    staleTime: 5 * 60 * 1000, // 5분
    retry: (failureCount, err) => {
      if (err instanceof ApiException && err.code === 'MEMBER4001') return false;
      return failureCount < 2;
    },
  });
