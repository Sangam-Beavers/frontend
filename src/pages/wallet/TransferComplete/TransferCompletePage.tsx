import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import { buildTransferReceiptPath } from '@/constants/routes';
import { useStampCard } from '@/hooks/useStampCard';
import styles from './TransferCompletePage.module.css';

interface CompleteState {
  recipientName: string;
  currency: string;
  amount: string;
  /** 송금 실행 응답의 public_id. 영수증 페이지가 path로 받아 API 조회한다.
   * 송금 실행 연동 사이클에서 호출처가 채워준다. 없으면 영수증 버튼 disabled. */
  transferPublicId?: string;
  /** 송금 유형 — 'REMITTANCE'(타행, 수수료 O)일 때만 적립/쿠폰 카드를 노출한다. 앱 내(INTERNAL)는 미노출. */
  transferType?: 'INTERNAL_TRANSFER' | 'REMITTANCE';
}

const FALLBACK: CompleteState = {
  recipientName: 'Linh',
  currency: 'VND',
  amount: '₫1,200,000',
};

/** 적립 카드 조회 실패/로딩 중 기본 칸 수(백엔드 기본 target과 동일). 표시용 fallback. */
const DEFAULT_TARGET = 5;

export default function TransferCompletePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const state = (location.state as CompleteState) ?? FALLBACK;

  // 스탬프 카드는 송금 직후 백엔드(AFTER_COMMIT 동기 적립)에 이미 반영돼 있어, 이 화면 진입 시 조회하면
  // 최신값을 본다. 조회 실패·로딩 중에는 0/DEFAULT_TARGET로 표시(적립 자체는 이미 완료 — 카드 표시
  // 실패가 송금 완료 UX를 막지 않게 한다).
  const { data: stampCard } = useStampCard();
  const target = stampCard?.target ?? DEFAULT_TARGET;
  const filledCount = stampCard?.current_count ?? 0;
  // 적립/쿠폰은 수수료가 있는 타행 송금(REMITTANCE)만 대상이다. 앱 내 송금(INTERNAL)에서는 카드를 숨긴다.
  const isRemittance = state.transferType === 'REMITTANCE';

  return (
    <>
      <TopBar title={t('transfer.complete.title')} showBack={false} />

      <div className={styles.checkOnly}>✓</div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>{t('transfer.complete.cardTitle')}</div>
        <div className={styles.cardText}>
          <span className={styles.highlight}>{state.recipientName}</span>
          {t('transfer.complete.recipientSuffix')} {state.currency} {state.amount}
          <br />
          {t('transfer.complete.feeProcessed')}
        </div>
      </div>

      {isRemittance && (
        <div className={styles.couponCard}>
          <div className={styles.couponTitle}>{t('transfer.complete.couponTitle')}</div>
          <div className={styles.couponDesc}>{t('transfer.complete.couponDesc')}</div>
          <div className={styles.stampRow}>
            {Array.from({ length: target }, (_, i) => {
              const filled = i < filledCount;
              return (
                <div key={i} className={`${styles.stamp} ${filled ? styles.stampFilled : ''}`}>
                  {filled ? '✓' : ''}
                </div>
              );
            })}
          </div>
          <div className={styles.couponNote}>{t('transfer.complete.couponNote')}</div>
        </div>
      )}

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn} onClick={() => navigate('/')}>
          {t('transfer.complete.goHome')}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          onClick={() => navigate('/mypage/wallet-history', { state: { from: '/' } })}
        >
          {t('transfer.complete.viewHistory')}
        </button>
        <button
          type="button"
          className={styles.ghostBtn}
          disabled={!state.transferPublicId}
          onClick={() => {
            if (state.transferPublicId) {
              navigate(buildTransferReceiptPath(state.transferPublicId));
            }
          }}
        >
          {t('transfer.complete.viewReceipt')}
        </button>
      </div>
    </>
  );
}
