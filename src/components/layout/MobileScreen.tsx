import { createContext, useState, type ReactNode } from 'react';
import styles from './MobileScreen.module.css';

/**
 * 고정 헤더 슬롯 컨텍스트. 페이지가 {@link ScreenHeader}로 상단 고정 영역(앱바)을 이 슬롯에 portal한다.
 * 슬롯은 스크롤 영역(.content) 밖에 있으므로, 스크롤해도 헤더는 고정되고 떨림/콘텐츠 비침이 없다.
 * ScreenHeader를 쓰지 않는 페이지는 슬롯이 빈 채로 높이 0이라 기존 동작에 영향이 없다.
 */
export const ScreenHeaderSlotContext = createContext<HTMLElement | null>(null);

interface MobileScreenProps {
  children: ReactNode;
  bottomSlot?: ReactNode;
  withBottomNav?: boolean;
}

export default function MobileScreen({
  children,
  bottomSlot,
  withBottomNav = true,
}: MobileScreenProps) {
  // 헤더 슬롯 DOM 노드. ScreenHeader가 이 노드로 portal한다.
  const [headerEl, setHeaderEl] = useState<HTMLDivElement | null>(null);
  const contentClass = withBottomNav ? styles.content : `${styles.content} ${styles.contentNoNav}`;

  return (
    <div className={styles.screen}>
      {/* 스크롤 밖 고정 헤더 슬롯. 비어 있으면 높이 0. */}
      <div className={styles.headerSlot} ref={setHeaderEl} />
      <ScreenHeaderSlotContext.Provider value={headerEl}>
        <div className={contentClass} data-scroll-root>
          {children}
        </div>
      </ScreenHeaderSlotContext.Provider>
      {bottomSlot}
    </div>
  );
}
