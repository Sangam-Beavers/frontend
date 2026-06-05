import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useBalances } from '@/hooks/useBalances';
import styles from './TransferSelectPage.module.css';

// 통화 기호 — HomePage/ExchangeSelect와 동일 패턴 (백엔드는 잔액만 내려보냄).
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

function formatBalance(code: string, balance: string): string {
  const symbol = CURRENCY_SYMBOL[code] ?? '';
  const num = Number(balance);
  if (code === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

export default function TransferSelectPage() {
  const navigate = useNavigate();
  const { data: balances, isLoading, error } = useBalances();

  // 잔액 0 통화는 표시에서 제외 (ExchangeSelect와 동일 정책).
  const heldBalances = (balances?.balances ?? []).filter((b) => Number(b.balance) > 0);
  const hasWalletError = error instanceof ApiException && error.code === 'WALLET4001';

  const balanceText = isLoading
    ? '불러오는 중...'
    : hasWalletError
      ? '전자지갑이 아직 생성되지 않았어요.'
      : heldBalances.length === 0
        ? '보유한 통화가 없습니다. 충전 후 이용해주세요.'
        : heldBalances
            .map((b) => `${b.currency_code} ${formatBalance(b.currency_code, b.balance)}`)
            .join(' · ');

  return (
    <>
      <TopBar title="보내기" />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>보낼 수 있는 전자지갑 잔액</div>
        <div className={styles.cardText}>{balanceText}</div>
      </div>

      <div className={styles.list}>
        <div className={styles.item} onClick={() => navigate('/transfer/app')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>앱 사용자에게 보내기</div>
            <div className={styles.itemMeta}>이메일 또는 아이디로 전송</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/transfer/bank')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>내 계좌로 보내기</div>
            <div className={styles.itemMeta}>미리 등록된 외부은행의 내 계좌번호로 송금</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/recurring')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>정기 송금 설정</div>
            <div className={styles.itemMeta}>대상, 금액, 일정을 지정해 반복 송금</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
      </div>
    </>
  );
}
