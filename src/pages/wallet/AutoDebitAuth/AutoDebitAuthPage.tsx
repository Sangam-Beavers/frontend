import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import type { AuthStep } from '@/types/charge';
import styles from './AutoDebitAuthPage.module.css';

const STEPS: AuthStep[] = [
  { index: 1, label: '인증 요청', done: true },
  { index: 2, label: '자동이체 동의', done: true },
  { index: 3, label: '인증 완료', done: false },
];

export default function AutoDebitAuthPage() {
  const navigate = useNavigate();
  // AddAccount에서 받은 입력값(AccountRegisterDraft)을 그대로 등록완료 화면으로 넘긴다.
  const { state } = useLocation();
  const goRegistered = () => navigate('/charge/account-registered', { state });

  return (
    <>
      <TopBar title="자동이체 인증" />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>계좌 연결 인증</div>
        <div className={styles.cardText}>
          실제 구현 범위 밖이지만, 화면상 자동이체 인증 프로세스를 표시합니다.
        </div>
      </div>

      <div className={styles.steps}>
        {STEPS.map((step) => (
          <div key={step.index} className={styles.step}>
            <span className={`${styles.dot} ${step.done ? '' : styles.dotOff}`}>{step.index}</span>
            {step.label}
          </div>
        ))}
      </div>

      <button type="button" className={styles.primary} onClick={goRegistered}>
        인증 요청하기
      </button>
      <button type="button" className={styles.ghost} onClick={goRegistered}>
        계좌 등록 완료
      </button>
    </>
  );
}
