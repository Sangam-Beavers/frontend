import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import styles from './BottomNav.module.css';

// activeIndex가 명시되지 않으면 useLocation으로 자동 계산
interface BottomNavProps {
  activeIndex?: number;
}

// 라벨은 t() 키로, 아이콘과 path는 상수로.
const NAV_ITEMS = [
  { icon: '⌂', labelKey: 'nav.home', path: ROUTES.HOME },
  { icon: '▣', labelKey: 'nav.documentAnalysis', path: ROUTES.DOC_ANALYSIS },
  { icon: '◌', labelKey: 'nav.community', path: ROUTES.COMMUNITY },
  { icon: '☰', labelKey: 'nav.allMenu', path: ROUTES.ALL_MENU },
] as const;

const resolveActiveIndex = (pathname: string): number => {
  if (pathname === ROUTES.HOME) return 0;
  const matched = NAV_ITEMS.findIndex(
    (item) => item.path !== ROUTES.HOME && pathname.startsWith(item.path)
  );
  return matched;
};

export default function BottomNav({ activeIndex }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const resolvedActive = activeIndex ?? resolveActiveIndex(location.pathname);

  return (
    <nav className={styles.nav}>
      {NAV_ITEMS.map((item, index) => (
        <button
          key={item.path}
          className={`${styles.navItem} ${index === resolvedActive ? styles.active : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className={styles.navIcon}>{item.icon}</span>
          {t(item.labelKey)}
        </button>
      ))}
    </nav>
  );
}
