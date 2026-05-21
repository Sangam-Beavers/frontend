import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { PAYMENT_METHODS } from '@/constants/paymentMethods';
import styles from './DocAnalysisPaymentPage.module.css';

export default function DocAnalysisPaymentPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <TopBar title="결제하기" onBack={() => navigate(-1)} />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>총 15,000원</div>
        <div className={styles.cardText}>
          최근 문서 분석 기록보다 이미지 파일로 최대 10문서를 확인할 수 있습니다.
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pay-method">
          결제 방법
        </label>
        <select
          id="pay-method"
          className={styles.select}
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.agreeRow} onClick={() => setAgreed((v) => !v)}>
        <span className={styles.agreeLabel}>약관 및 개인정보 동의</span>
        <div className={`${styles.checkbox} ${agreed ? styles.checkboxChecked : ''}`}>
          {agreed && '✓'}
        </div>
      </div>

      <button
        type="button"
        className={styles.primaryBtn}
        disabled={!agreed}
        onClick={() => navigate('/doc-analysis/loading')}
      >
        총 15,000원 결제하기
      </button>
    </>
  );
}
