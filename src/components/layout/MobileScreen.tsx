import type { ReactNode } from 'react';
import styles from './MobileScreen.module.css';

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
  const contentClass = withBottomNav ? styles.content : `${styles.content} ${styles.contentNoNav}`;

  return (
    <div className={styles.screen}>
      <div className={contentClass} data-scroll-root>
        {children}
      </div>
      {bottomSlot}
    </div>
  );
}
