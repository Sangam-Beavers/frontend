import { Route, Routes } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import VerifiedRoute from '@/routes/VerifiedRoute';
import {
  authRoutes,
  financialServiceRoutes,
  mainRoutes,
  nonFinancialServiceRoutes,
} from '@/routes/pageRoutes';

export default function Router() {
  return (
    <Routes>
      {/* ===== Auth (인증 불필요, AuthLayout) ===== */}
      <Route element={<AuthLayout />}>
        {authRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Route>

      {/* ===== Main / Service (로그인 필요, MainLayout: MobileScreen + BottomNav) ===== */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* --- Main: 하단탭 진입 영역 (홈/전체메뉴/커뮤니티/마이페이지) — 미인증도 허용 --- */}
          {mainRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/* --- 비금융 서비스: 문서분석 등 — 미인증도 허용 --- */}
          {nonFinancialServiceRoutes.map(({ path, Component }) => (
            <Route key={path} path={path} element={<Component />} />
          ))}

          {/* --- 금융 서비스: 충전·환전·송금·정기송금 — 신분증 인증 필요(이슈 #108) --- */}
          <Route element={<VerifiedRoute />}>
            {financialServiceRoutes.map(({ path, Component }) => (
              <Route key={path} path={path} element={<Component />} />
            ))}
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
