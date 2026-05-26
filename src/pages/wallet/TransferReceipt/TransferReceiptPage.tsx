import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import styles from './TransferReceiptPage.module.css';

interface ReceiptState {
  txId?: string;
  dateTime?: string;
  sender?: string;
  recipient?: string;
  method?: string;
  currency?: string;
  amount?: string;
  fee?: string;
  processingTime?: string;
}

const FALLBACK: Required<ReceiptState> = {
  txId: 'GB-20260521-00082',
  dateTime: '2026.05.21 11:24',
  sender: '김소영',
  recipient: 'Linh',
  method: '앱 내 이체',
  currency: 'VND',
  amount: '₫1,200,000',
  fee: '없음',
  processingTime: '82ms',
};

export default function TransferReceiptPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const data: Required<ReceiptState> = { ...FALLBACK, ...(location.state as ReceiptState) };

  const rows: [string, string, boolean?][] = [
    ['거래번호', data.txId],
    ['송금일시', data.dateTime],
    ['보낸 사람', data.sender],
    ['받는 사람', data.recipient],
    ['송금 방식', data.method],
    ['송금 통화', data.currency],
    ['송금 금액', data.amount],
    ['수수료', data.fee],
    ['처리 시간', data.processingTime],
    ['상태', '완료', true],
  ];

  return (
    <>
      <TopBar
        title="송금 확인증"
        onBack={() => navigate(-1)}
        rightAction={
          <button className={styles.iconBtn} aria-label="더보기">
            ⋯
          </button>
        }
      />

      <div className={styles.receipt}>
        <div className={styles.receiptHead}>
          <div className={styles.stamp}>✓</div>
          <div className={styles.receiptTitle}>송금 완료 확인증</div>
          <div className={styles.receiptSub}>Global Bridge 전자지갑 송금 내역</div>
        </div>

        {rows.map(([label, value, isBlue]) => (
          <div key={label} className={styles.row}>
            <span className={styles.rowLabel}>{label}</span>
            <b className={isBlue ? styles.rowValueBlue : styles.rowValue}>{value}</b>
          </div>
        ))}
      </div>

      <div className={styles.qrCard}>
        <div className={styles.qr} aria-label="QR 코드" />
        <div className={styles.qrInfo}>
          <div className={styles.qrTitle}>확인용 QR</div>
          <div className={styles.qrDesc}>
            송금 확인증 진위 확인 또는 공유 시 사용할 수 있습니다.
          </div>
        </div>
      </div>

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn}>
          이미지로 저장하기
        </button>
        <button type="button" className={styles.secondaryBtn}>
          PDF로 저장하기
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </div>
    </>
  );
}
