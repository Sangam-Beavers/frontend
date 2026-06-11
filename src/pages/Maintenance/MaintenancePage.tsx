import { useTranslation } from 'react-i18next';
import styles from './MaintenancePage.module.css';

export default function MaintenancePage() {
  const { t } = useTranslation();
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>🔧</div>
      <h1 className={styles.title}>{t('maintenance.title')}</h1>
      <p className={styles.body}>
        {t('maintenance.body')}
        <br />
        {t('maintenance.retry')}
      </p>
    </div>
  );
}
