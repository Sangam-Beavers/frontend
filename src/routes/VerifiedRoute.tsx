import { Navigate, Outlet } from 'react-router-dom';
import { ApiException } from '@/api';
import { ROUTES } from '@/constants/routes';
import { useMyProfile } from '@/hooks/useMyProfile';

/**
 * 금융 기능 가드 (이슈 #108).
 *
 * <p>{@link ProtectedRoute}가 "로그인 여부"를 본다면, 본 가드는 "신분증 인증 여부"를 본다.
 * 미인증(`is_verified=false`)이면 충전·송금·환전·정기송금 등 금융 라우트 진입 시 신분증 인증
 * 화면(`/mypage/badge`)으로 강제 이동시킨다. 환율 조회·문서 분석·커뮤니티는 미인증에서도 허용.
 *
 * <p>인증 상태는 {@link useMyProfile}로 받는다(staleTime 5분 캐시). 첫 진입 시 잠깐 로딩이
 * 발생하지만 React Query 캐시 덕에 다음 진입부터는 즉시 렌더된다.
 *
 * <p>개발용 우회: {@code VITE_SKIP_VERIFIED=true}면 가드를 건너뛴다(화면 확인용 — 운영 빌드에선 미설정).
 */
export default function VerifiedRoute() {
  const skip = import.meta.env.VITE_SKIP_VERIFIED === 'true';
  const { data, isLoading, error } = useMyProfile();

  if (skip) {
    return <Outlet />;
  }

  // 프로필 조회 자체가 실패한 경우(회원 미존재 등) — 가드를 막아 인증 화면으로 보낸다.
  // 401(인증 만료)는 apiClient interceptor가 로그인 페이지로 자동 이동하므로 여기선 추가 처리 불요.
  if (error instanceof ApiException) {
    return <Navigate to={ROUTES.MYPAGE_BADGE} replace />;
  }

  // 프로필 로딩 중에는 빈 화면 — 깜빡임을 최소화하려면 스피너 컴포넌트로 교체 가능.
  if (isLoading || !data) {
    return null;
  }

  if (!data.is_verified) {
    return <Navigate to={ROUTES.MYPAGE_BADGE} replace />;
  }

  return <Outlet />;
}
