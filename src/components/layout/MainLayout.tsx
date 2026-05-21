import { Outlet } from 'react-router-dom';
import BottomNav from '@/components/navigation/BottomNav';
import MobileScreen from '@/components/layout/MobileScreen';

export default function MainLayout() {
  return (
    <MobileScreen bottomSlot={<BottomNav />}>
      <Outlet />
    </MobileScreen>
  );
}
