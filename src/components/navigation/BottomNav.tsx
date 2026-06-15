import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/constants/routes';
import { DocSearchIcon, GridIcon, HomeIcon, UsersIcon } from '@/components/common/icons';
import styles from './BottomNav.module.css';

// activeIndex가 명시되지 않으면 useLocation으로 자동 계산
interface BottomNavProps {
  activeIndex?: number;
}

// 라벨은 t() 키로, 아이콘(SVG 컴포넌트)과 path는 상수로.
const NAV_ITEMS = [
  { Icon: HomeIcon, labelKey: 'nav.home', path: ROUTES.HOME },
  { Icon: DocSearchIcon, labelKey: 'nav.documentAnalysis', path: ROUTES.DOC_ANALYSIS },
  { Icon: UsersIcon, labelKey: 'nav.community', path: ROUTES.COMMUNITY },
  { Icon: GridIcon, labelKey: 'nav.allMenu', path: ROUTES.ALL_MENU },
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
          <item.Icon className={styles.navIcon} size={24} />
          {t(item.labelKey)}
        </button>
      ))}
    </nav>
  );
}
