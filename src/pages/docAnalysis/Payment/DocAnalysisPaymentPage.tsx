import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import { PAYMENT_METHODS } from '@/constants/paymentMethods';
import styles from './DocAnalysisPaymentPage.module.css';

export default function DocAnalysisPaymentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [method, setMethod] = useState<string>(PAYMENT_METHODS[0]);
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <TopBar title={t('doc.payment.title')} onBack={() => navigate(-1)} />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>{t('doc.payment.totalAmount')}</div>
        <div className={styles.cardText}>{t('doc.payment.description')}</div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="pay-method">
          {t('doc.payment.methodLabel')}
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
        <span className={styles.agreeLabel}>{t('doc.payment.agreeLabel')}</span>
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
        {t('doc.payment.payButton')}
      </button>
    </>
  );
}
