import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { isLoggedIn } from '@/auth/tokenStore';

// ③ 앱 보호(문지기): 저장된 토큰이 있어야 통과. 없으면 로그인 화면으로 보냄.
// 개발 중에는 .env.local의 VITE_SKIP_AUTH=true로 가드를 건너뛸 수 있음(로그인 없이 화면 확인용).
export default function ProtectedRoute() {
  const authed = import.meta.env.VITE_SKIP_AUTH === 'true' || isLoggedIn();
  if (!authed) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
