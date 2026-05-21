import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/constants/routes';
import type { NavItem } from '@/types/home';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  activeIndex: number;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '⌂', label: '홈', path: ROUTES.HOME },
  { icon: '▣', label: '문서 분석', path: ROUTES.DOC_ANALYSIS },
  { icon: '◌', label: '커뮤니티', path: ROUTES.COMMUNITY },
  { icon: '☰', label: '전체메뉴', path: ROUTES.ALL_MENU },
];

export default function BottomNav({ activeIndex }: BottomNavProps) {
  const navigate = useNavigate();
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item, index) => (
        <button
          key={item.path}
          className={`${styles.navItem} ${index === activeIndex ? styles.active : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
