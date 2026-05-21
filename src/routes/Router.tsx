import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import { authRoutes, mainRoutes, serviceRoutes } from '@/routes/pageRoutes';

export default function Router() {
  return (
    <Routes>
      {/* ===== Auth (인증 불필요) ===== */}
      {authRoutes.map(({ path, Component }) => (
        <Route key={path} path={path} element={<Component />} />
      ))}

      {/* ===== Main / Service (인증 필요) ===== */}
      <Route element={<ProtectedRoute />}>
        {/* --- Main: 하단탭 진입 영역 (홈/전체메뉴/커뮤니티/마이페이지) --- */}
        {mainRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}

        {/* --- Service: 기능 플로우 (충전/환전/송금/정기송금/문서분석) --- */}
        {serviceRoutes.map(({ path, Component }) => (
          <Route key={path} path={path} element={<Component />} />
        ))}
      </Route>
    </Routes>
  );
}
