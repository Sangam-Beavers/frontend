import { useNavigate } from 'react-router-dom';
import { COMMUNITY_TABS, type CommunityCategory } from '@/types/community';
import styles from './CommunityTabs.module.css';

interface CommunityTabsProps {
  active: CommunityCategory;
}

export default function CommunityTabs({ active }: CommunityTabsProps) {
  const navigate = useNavigate();

  return (
    <div className={styles.tabs}>
      {COMMUNITY_TABS.map((tab) => {
        const className = tab.category === active ? `${styles.tab} ${styles.active}` : styles.tab;
        return (
          <button
            key={tab.category}
            type="button"
            className={className}
            onClick={() => navigate(tab.path)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
