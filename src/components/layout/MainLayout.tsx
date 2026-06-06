import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/navigation/BottomNav';
import MobileScreen from '@/components/layout/MobileScreen';
import { useScrollRestoration } from '@/hooks/useScrollRestoration';

export default function MainLayout() {
  // 라우트가 바뀌어도 살아있는 영속 컨테이너의 스크롤 위치를 history 기준 복원(뒤로 가기 시 위치 유지).
  useScrollRestoration();

  return (
    <MobileScreen bottomSlot={<BottomNav />}>
      <Outlet />
    </MobileScreen>
  );
}
