import { useQuery } from '@tanstack/react-query';
import { ApiException } from '@/api';
import { memberApi, type TrustMilestonesResponse } from '@/api/member';

/**
 * 내 신뢰등급 마일스톤 현황 조회 hook (Phase 2 — FE-4 등급 바텀시트 / 백엔드 BE-6).
 *
 * <p>마이페이지 아바타 탭 → 등급 바텀시트에서 사용한다. 시트가 닫혀 있을 땐 호출하지 않도록
 * {@code enabled}로 게이트한다(열릴 때 lazy fetch — 마이페이지 진입만으로 불필요한 호출 없음).
 *
 * <p>인증 필요(JWT) — ProtectedRoute 안에서만 사용. 토큰 부착은 apiClient interceptor가 자동.
 *
 * <p>staleTime 1분 — 마일스톤은 사용자의 행동(인증/계좌 연결/거래)으로만 바뀐다.
 * 행동 완료 직후 갱신이 필요하면 호출 측에서
 * {@code queryClient.invalidateQueries(['member','me','trust-milestones'])}로 무효화한다.
 *
 * <p>회원 미존재(404 MEMBER4001)는 비즈니스 에러라 재시도 무의미 — 즉시 에러 상태로
 * (바텀시트가 재시도 안내 표시. Phase 1 테두리 표시는 useMyProfile 기반이라 무영향).
 *
 * @param enabled 바텀시트 오픈 여부. false면 호출 보류.
 */
export const useTrustMilestones = (enabled: boolean = true) =>
  useQuery<TrustMilestonesResponse>({
    queryKey: ['member', 'me', 'trust-milestones'],
    queryFn: () => memberApi.getTrustMilestones(),
    enabled,
    staleTime: 60_000,
    retry: (failureCount, err) => {
      if (err instanceof ApiException && err.code === 'MEMBER4001') return false;
      return failureCount < 2;
    },
  });
