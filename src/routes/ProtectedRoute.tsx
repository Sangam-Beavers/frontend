import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { isLoggedIn } from '@/auth/tokenStore';
import { useLanguageSync } from '@/hooks/useLanguageSync';

// ③ 앱 보호(문지기): 저장된 토큰이 있어야 통과. 없으면 로그인 화면으로 보냄.
// 개발 중에는 .env.local의 VITE_SKIP_AUTH=true로 가드를 건너뛸 수 있음(로그인 없이 화면 확인용).
//
// 이슈 #153 — 인증된 사용자에 한해 서버 저장 언어(members.language)를 i18next로 자동 동기화.
// 비로그인 영역(/login 등)은 이 컴포넌트를 거치지 않으므로 401 호출이 발생하지 않는다.
export default function ProtectedRoute() {
  const authed = import.meta.env.VITE_SKIP_AUTH === 'true' || isLoggedIn();
  // 인증 통과 이후에만 서버 언어 동기화 — 토큰 없으면 useMyLanguage가 401을 일으켜 redirect 루프 가능.
  useLanguageSync();
  if (!authed) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
