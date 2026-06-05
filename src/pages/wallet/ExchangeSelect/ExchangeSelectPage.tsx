import { useNavigate } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useBalances } from '@/hooks/useBalances';
import { useSupportedCurrencies } from '@/hooks/useSupportedCurrencies';
import styles from './ExchangeSelectPage.module.css';

// 통화 기호 (백엔드 응답에는 잔액에 기호가 없음, 클라이언트 보강).
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

export default function ExchangeSelectPage() {
  const navigate = useNavigate();
  const { data: currenciesData } = useSupportedCurrencies();
  const { data: balancesData, isLoading: balancesLoading, error: balancesError } = useBalances();

  // 외화 = KRW 제외한 모든 지원 통화. API 응답 전이거나 실패 시엔 빈 라벨로 두지 않고 보수적인
  // fallback("USD / PHP / VND")을 보여준다 — Select는 안내성 화면이라 라벨 누락은 UX 손해.
  const foreignCodes =
    currenciesData?.currencies
      .filter((c) => c.currency_code !== 'KRW')
      .map((c) => c.currency_code)
      .join(' / ') ?? 'USD / PHP / VND';

  // 보유 통화 카드 — 잔액 0 통화는 표시에서 제외해 깔끔하게.
  // 지갑 없음(WALLET4001)이면 빈 배열로 처리하여 "보유 통화 없음" 노출.
  const heldBalances = (balancesData?.balances ?? []).filter((b) => Number(b.balance) > 0);
  const hasWalletError =
    balancesError instanceof ApiException && balancesError.code === 'WALLET4001';

  return (
    <>
      <TopBar title="환전 선택" />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>원하는 환전 방식을 선택하세요</div>
        <div className={styles.cardText}>
          환전은 언제든지 가능하며, 결과는 전자지갑에 통화별로 보관됩니다.
        </div>
      </div>

      <div className={styles.list}>
        <div className={styles.item} onClick={() => navigate('/exchange/form')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>환전</div>
            <div className={styles.itemMeta}>원화 KRW → 외화 {foreignCodes}</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
        <div className={styles.item} onClick={() => navigate('/exchange/reverse')}>
          <div className={styles.itemMain}>
            <div className={styles.itemTitle}>재환전</div>
            <div className={styles.itemMeta}>외화 {foreignCodes} → 원화 KRW</div>
          </div>
          <div className={styles.arrowIcon}>›</div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>보유 통화</div>
        <div className={styles.cardText}>
          {balancesLoading
            ? '불러오는 중...'
            : hasWalletError
              ? '전자지갑이 아직 생성되지 않았어요.'
              : heldBalances.length === 0
                ? '보유한 통화가 없습니다. 충전 후 이용해주세요.'
                : heldBalances
                    .map((b) => `${b.currency_code} ${formatBalance(b.currency_code, b.balance)}`)
                    .join(' · ')}
        </div>
        {balancesData?.updated_at && (
          <div className={styles.cardSubtle}>
            업데이트 {new Date(balancesData.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </>
  );
}
