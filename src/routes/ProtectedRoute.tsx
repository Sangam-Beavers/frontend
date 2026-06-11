import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import { isLoggedIn } from '@/auth/tokenStore';
import { useLanguageSync } from '@/hooks/useLanguageSync';

export default function ProtectedRoute() {
  const authed = import.meta.env.VITE_SKIP_AUTH === 'true' || isLoggedIn();
  useLanguageSync();
  if (!authed) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  return <Outlet />;
}
