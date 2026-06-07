import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import type { RegisteredAccountView } from '@/types/charge';
import styles from './AccountRegisteredPage.module.css';

export default function AccountRegisteredPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // register 성공 시 AutoDebitAuth가 넘긴 "서버 확정" 계좌. 새로고침·직접 진입 시엔 null.
  const { state } = useLocation();
  const acc = state as RegisteredAccountView | null;

  return (
    <>
      <TopBar title={t('charge.registered.title')} showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('charge.registered.cardTitle')}</div>
        {acc ? (
          <>
            <div className={styles.cardText}>
              {acc.bankName} · {acc.accountNumberMasked}
            </div>
            {acc.holderName && (
              <div className={styles.cardText}>
                {t('charge.registered.holder', { holderName: acc.holderName })}
              </div>
            )}
          </>
        ) : (
          <div className={styles.cardText}>{t('charge.registered.fallback')}</div>
        )}
      </div>

      <button type="button" className={styles.primary} onClick={() => navigate('/charge')}>
        {t('charge.registered.continueCharge')}
      </button>
      <button type="button" className={styles.ghost} onClick={() => navigate('/')}>
        {t('charge.registered.backHome')}
      </button>
    </>
  );
}
