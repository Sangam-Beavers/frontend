import { Route, Routes } from 'react-router-dom';
import AuthLayout from '@/components/layout/AuthLayout';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import VerifiedRoute from '@/routes/VerifiedRoute';
import AdminRoute from '@/routes/AdminRoute';
import MaintenanceGuard from '@/routes/MaintenanceGuard';
import {
  adminRoutes,
  authRoutes,
  financialServiceRoutes,
  mainRoutes,
  nonFinancialServiceRoutes,
  publicContentRoutes,
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

      {/* ===== 공개 콘텐츠 (로그인 불필요 — 공지사항·FAQ) ===== */}
      <Route element={<MainLayout />}>
        {publicContentRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Route>

      {/* ===== Main / Service (로그인 필요, MainLayout: MobileScreen + BottomNav) ===== */}
      <Route element={<ProtectedRoute />}>
        {/* 점검 모드 가드 — MAINTENANCE_MODE=true면 admin 제외 점검 화면 표시 */}
        <Route element={<MaintenanceGuard />}>
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

            {/* --- 앱 관리: admin 그룹 전용 (JWT groups claim) --- */}
            <Route element={<AdminRoute />}>
              {adminRoutes.map(({ path, Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
            </Route>
          </Route>
        </Route>
        {/* MaintenanceGuard */}
      </Route>
    </Routes>
  );
}
