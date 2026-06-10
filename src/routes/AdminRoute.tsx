import { Navigate, Outlet } from 'react-router-dom';
import { isAdminUser } from '@/auth/tokenStore';
import { ROUTES } from '@/constants/routes';

/**
 * admin 그룹 전용 가드.
 * JWT groups 클레임에 "admin"이 없으면 마이페이지로 돌려보낸다.
 * (인증 자체는 바깥 ProtectedRoute에서 이미 확인됨)
 */
export default function AdminRoute() {
  if (!isAdminUser()) {
    return <Navigate to={ROUTES.MYPAGE} replace />;
  }
  return <Outlet />;
}
