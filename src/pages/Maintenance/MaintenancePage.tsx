import styles from './MaintenancePage.module.css';

export default function MaintenancePage() {
  return (
    <div className={styles.wrap}>
      <div className={styles.icon}>🔧</div>
      <h1 className={styles.title}>서비스 점검 중</h1>
      <p className={styles.body}>
        더 나은 서비스를 위해 점검 작업이 진행 중입니다.
        <br />
        잠시 후 다시 이용해 주세요.
      </p>
    </div>
  );
}
