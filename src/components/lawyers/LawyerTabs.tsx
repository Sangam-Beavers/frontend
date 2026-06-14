import { LAWYER_TABS } from '@/types/lawyer';
import type { LawyerTabKey } from '@/types/lawyer';
import styles from './LawyerTabs.module.css';

interface LawyerTabsProps {
  active: LawyerTabKey;
  onChange: (key: LawyerTabKey) => void;
}

/** 변호사 분야 탭(전체/노동/비자/계약/임금체불/산재). 활성 탭은 밑줄 강조. */
export default function LawyerTabs({ active, onChange }: LawyerTabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {LAWYER_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? `${styles.tab} ${styles.active}` : styles.tab}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
