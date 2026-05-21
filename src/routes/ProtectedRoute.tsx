import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';

// TODO: 실제 인증 상태로 교체 (예: useAuthStore, context, 토큰 검사 등)
// 개발 중에는 .env.development의 VITE_SKIP_AUTH=true로 가드를 건너뛸 수 있음
const isAuthenticated = import.meta.env.VITE_SKIP_AUTH === 'true';

export default function ProtectedRoute() {
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
