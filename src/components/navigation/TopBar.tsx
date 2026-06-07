import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './TopBar.module.css';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
}

export default function TopBar({ title, showBack = true, onBack, rightAction }: TopBarProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(-1);
  };

  return (
    <div className={styles.top}>
      {showBack ? (
        <button className={styles.icon} onClick={handleBack} aria-label={t('common.back')}>
          ‹
        </button>
      ) : (
        <div className={styles.iconPlaceholder} />
      )}
      <div className={styles.title}>{title}</div>
      {rightAction ?? <div className={styles.iconPlaceholder} />}
    </div>
  );
}
