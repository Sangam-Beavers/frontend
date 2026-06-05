import type {
  TransactionDirection,
  TransactionHistoryItem,
  TransactionStatusCode,
  TransactionTypeCode,
} from '@/api/wallet';
import type { WalletReceiptInfo, WalletTransaction, WalletTxKind } from '@/types/history';

/**
 * 백엔드 거래내역 항목(TransactionHistoryItem)을 화면 표시용 모델(WalletTransaction)로 변환한다.
 *
 * 백엔드는 type(CHARGE/INTERNAL_TRANSFER/REMITTANCE/EXCHANGE) × direction(OUT/IN)로
 * raw 데이터를 주고, 화면은 kind(charge/send/receive) + 가공된 title/meta/amountDisplay를 쓴다.
 *
 * 변환 규칙:
 * - CHARGE → kind='charge', 잔액 증가(isOutgoing=false), title="충전"
 * - INTERNAL_TRANSFER OUT → kind='send', isOutgoing=true, title="송금"
 * - INTERNAL_TRANSFER IN  → kind='receive', isOutgoing=false, title="받기"
 * - REMITTANCE → kind='send', isOutgoing=true, title="해외 송금"
 * - EXCHANGE → kind='send'(분류 임시), isOutgoing=true, title="환전"
 *   ※ EXCHANGE는 환전 내역 페이지(/mypage/exchange-history)가 별도로 있어 추후 와이어프레임
 *     확정 시 거래내역 페이지에서 제외할지 결정 — TODO.
 */
export function toWalletTransaction(item: TransactionHistoryItem): WalletTransaction {
  const kind = resolveKind(item.type, item.direction);
  const isOutgoing = resolveIsOutgoing(item.type, item.direction);
  return {
    id: item.public_id,
    kind,
    title: resolveTitle(item.type, item.direction),
    meta: buildMeta(item),
    amountDisplay: formatAmountDisplay(item, isOutgoing),
    isOutgoing,
    receiptInfo: shouldHaveReceipt(item) ? buildReceiptInfo(item) : undefined,
  };
}

// ---------- kind / direction 결정 ----------

function resolveKind(type: TransactionTypeCode, direction: TransactionDirection): WalletTxKind {
  if (type === 'CHARGE') return 'charge';
  if (type === 'INTERNAL_TRANSFER') return direction === 'IN' ? 'receive' : 'send';
  // REMITTANCE / EXCHANGE는 모두 출금 성격 → 'send'로 묶는다(탭 분류 단순화).
  return 'send';
}

/**
 * 잔액 차감(true) / 증가(false) 여부. 화면 색상(빨강/초록)에 사용.
 *
 * 주의: direction=OUT/IN은 "transaction row의 주체가 본인인지"라 잔액 방향과 다르다.
 * 예: CHARGE는 direction=OUT(본인 wallet 행)이지만 잔액은 증가(입금).
 */
function resolveIsOutgoing(type: TransactionTypeCode, direction: TransactionDirection): boolean {
  if (type === 'CHARGE') return false; // 외부→내 지갑 (입금)
  if (type === 'INTERNAL_TRANSFER') return direction === 'OUT';
  // REMITTANCE: 해외 송금(출금), EXCHANGE: 한쪽 통화 차감(출금 관점 표시)
  return true;
}

function resolveTitle(type: TransactionTypeCode, direction: TransactionDirection): string {
  switch (type) {
    case 'CHARGE':
      return '충전';
    case 'INTERNAL_TRANSFER':
      return direction === 'IN' ? '받기' : '송금';
    case 'REMITTANCE':
      return '해외 송금';
    case 'EXCHANGE':
      return '환전';
    default:
      return '거래';
  }
}

// ---------- 표시 가공 ----------

const STATUS_LABEL: Record<TransactionStatusCode, string> = {
  PENDING: '대기',
  PROCESSING: '처리중',
  COMPLETED: '완료',
  FAILED: '실패',
  CANCELLED: '취소',
};

/**
 * meta 행 — mock 패턴 모사 (예: "Linh · 2026.05.15 · 완료" / "2026.05.20 · 완료").
 *
 * 표시 가능한 상대 정보가 다른 경우 우선순위:
 * 1) receiver_name(송금/해외송금)
 * 2) EXCHANGE — "KRW → USD" 통화쌍
 * 3) CHARGE / INTERNAL_TRANSFER IN — 상대 정보 없음(백엔드 응답에 sender_name 없음 — TODO)
 */
function buildMeta(item: TransactionHistoryItem): string {
  const parts: string[] = [];

  if (
    item.type === 'REMITTANCE' ||
    (item.type === 'INTERNAL_TRANSFER' && item.direction === 'OUT')
  ) {
    if (item.receiver_name) parts.push(item.receiver_name);
  } else if (item.type === 'EXCHANGE' && item.receive_currency_code) {
    parts.push(`${item.currency_code} → ${item.receive_currency_code}`);
  }

  parts.push(formatDate(item.created_at));
  parts.push(STATUS_LABEL[item.status] ?? item.status);
  return parts.join(' · ');
}

/**
 * 금액 표시 — 부호 + 통화 기호 + 천단위 콤마.
 * 예: "+₩300,000", "-₫1,200,000", "-$72.45"
 *
 * 입금(isOutgoing=false)인 INTERNAL_TRANSFER IN의 표시 금액은 receive_amount가 아니라 amount다.
 * 백엔드 amount = 송신자 시점의 출금 금액 = 수신자 시점에서도 받은 금액(같은 통화 송금이라 동일).
 * 통화는 currency_code(KRW 등) 그대로 사용.
 */
function formatAmountDisplay(item: TransactionHistoryItem, isOutgoing: boolean): string {
  const sign = isOutgoing ? '-' : '+';
  const symbol = currencySymbol(item.currency_code);
  const formatted = formatNumber(item.amount, item.currency_code);
  return `${sign}${symbol}${formatted}`;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  VND: '₫',
  PHP: '₱',
};
function currencySymbol(code: string): string {
  return CURRENCY_SYMBOL[code] ?? `${code} `;
}

/**
 * BigDecimal string(예: "300000.0000") → 표시용("300,000" 또는 "72.45").
 * KRW/VND는 소수 표시 없이 정수만, USD/PHP는 소수 2자리까지 표시(0 끝자리 제거).
 */
function formatNumber(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  const noDecimals = currencyCode === 'KRW' || currencyCode === 'VND';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  });
}

/** ISO 8601 UTC Z → "YYYY.MM.DD" (사용자 로컬 타임존). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

// ---------- 영수증 ----------

/**
 * 영수증 정보(WalletReceiptInfo)는 송금 거래만 보유 — mock 패턴 따름.
 * 송금 = INTERNAL_TRANSFER OUT 또는 REMITTANCE.
 */
function shouldHaveReceipt(item: TransactionHistoryItem): boolean {
  if (item.type === 'INTERNAL_TRANSFER' && item.direction === 'OUT') return true;
  if (item.type === 'REMITTANCE') return true;
  return false;
}

function buildReceiptInfo(item: TransactionHistoryItem): WalletReceiptInfo {
  // 수령액 표시: 동일 통화 INTERNAL_TRANSFER는 amount 그대로, REMITTANCE는 receive_amount(외화).
  const useReceive =
    item.type === 'REMITTANCE' && item.receive_amount && item.receive_currency_code;
  const displayAmount = useReceive
    ? `${currencySymbol(item.receive_currency_code as string)}${formatNumber(
        item.receive_amount as string,
        item.receive_currency_code as string
      )}`
    : `${currencySymbol(item.currency_code)}${formatNumber(item.amount, item.currency_code)}`;

  return {
    recipient: item.receiver_name ?? undefined,
    amount: displayAmount,
    txId: item.public_id,
    dateTime: formatDate(item.created_at),
  };
}
