import { useNavigate } from 'react-router-dom';
import styles from './TopBar.module.css';

interface TopBarProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

export default function TopBar({ title, showBack = true, onBack }: TopBarProps) {
  const navigate = useNavigate();

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
        <button className={styles.icon} onClick={handleBack} aria-label="뒤로가기">
          ‹
        </button>
      ) : (
        <div className={styles.iconPlaceholder} />
      )}
      <div className={styles.title}>{title}</div>
      <div className={styles.iconPlaceholder} />
    </div>
  );
}
