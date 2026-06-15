import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { COMMUNITY_TABS, type CommunityCategory } from '@/types/community';
import styles from './CommunityTabs.module.css';

interface CommunityTabsProps {
  active?: CommunityCategory;
}

export default function CommunityTabs({ active }: CommunityTabsProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // scrollLeft만 조정 — 세로 스크롤(목록 위치)은 건드리지 않는다.
  useLayoutEffect(() => {
    const list = listRef.current;
    const tab = activeRef.current;
    if (!list || !tab) return;
    // 가운데로 정렬하지 않고, 활성 탭이 가려졌을 때만 최소로 스크롤해 보이게 한다(어색한 재정렬 방지).
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const pad = 12;
    const leftOverflow = tabRect.left - (listRect.left + pad);
    const rightOverflow = tabRect.right - (listRect.right - pad);
    if (leftOverflow < 0) {
      list.scrollLeft += leftOverflow;
    } else if (rightOverflow > 0) {
      list.scrollLeft += rightOverflow;
    }
  }, [active]);

  return (
    <div className={styles.tabs} ref={listRef}>
      {COMMUNITY_TABS.map((tab) => {
        const isActive = tab.category === active;
        const className = isActive ? `${styles.tab} ${styles.active}` : styles.tab;
        return (
          <button
            key={tab.category}
            ref={isActive ? activeRef : undefined}
            type="button"
            className={className}
            onClick={() => navigate(tab.path)}
          >
            {t(`community.categories.${tab.category}`)}
          </button>
        );
      })}
    </div>
  );
}
