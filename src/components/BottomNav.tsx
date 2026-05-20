import type { NavItem } from '@/types/home';
import styles from './BottomNav.module.css';

interface BottomNavProps {
  activeIndex: number;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '⌂', label: '홈', path: '/' },
  { icon: '▣', label: '문서 분석', path: '/documents' },
  { icon: '◌', label: '커뮤니티', path: '/community' },
  { icon: '☰', label: '전체메뉴', path: '/menu' },
];

export default function BottomNav({ activeIndex }: BottomNavProps) {
  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item, index) => (
        <button
          key={item.path}
          className={`${styles.navItem} ${index === activeIndex ? styles.active : ''}`}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          {item.label}
        </button>
      ))}
    </nav>
  );
}
