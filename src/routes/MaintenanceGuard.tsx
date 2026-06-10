import { Outlet } from 'react-router-dom';
import { isAdminUser } from '@/auth/tokenStore';
import { useSetting } from '@/hooks/useServiceSettings';
import MaintenancePage from '@/pages/Maintenance/MaintenancePage';

/**
 * 점검 모드 가드.
 * MAINTENANCE_MODE=true이고 admin이 아닌 사용자는 점검 화면으로 막는다.
 * admin 계정은 점검 중에도 앱을 정상 사용할 수 있다.
 */
export default function MaintenanceGuard() {
  const maintenanceMode = useSetting('MAINTENANCE_MODE', 'false');
  const isAdmin = isAdminUser();

  if (maintenanceMode === 'true' && !isAdmin) {
    return <MaintenancePage />;
  }

  return <Outlet />;
}
