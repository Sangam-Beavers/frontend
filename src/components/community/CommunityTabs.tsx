import { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { COMMUNITY_TABS, type CommunityCategory } from '@/types/community';
import styles from './CommunityTabs.module.css';

interface CommunityTabsProps {
  active: CommunityCategory;
}

export default function CommunityTabs({ active }: CommunityTabsProps) {
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // 선택된 탭을 가로 스크롤 영역 가운데로 가져온다(특히 마지막 '자유게시판'이 오른쪽으로 잘리는 문제).
  // 컨테이너의 scrollLeft만 조정 — 세로 스크롤(목록 위치)은 건드리지 않는다.
  useLayoutEffect(() => {
    const list = listRef.current;
    const tab = activeRef.current;
    if (!list || !tab) return;
    const listRect = list.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const delta = tabRect.left - listRect.left - (list.clientWidth - tabRect.width) / 2;
    list.scrollLeft += delta;
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
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
