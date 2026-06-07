// ─────────────────────────────────────────────────────────────
// pages/wallet/TransferReceipt/TransferReceiptPage.tsx — 송금 확인증
//
// 데이터: useReceipt(transferPublicId) → walletApi.getReceipt (api-spec §7-1).
// 라우트: /transfer/receipt/:transferPublicId
//
// type 추론: 백엔드 응답에 type 필드는 없지만 bank_name이 null이면 INTERNAL_TRANSFER,
//            값이 있으면 REMITTANCE로 판단한다(api-spec §7-1 — bank_name은 REMITTANCE만 채워짐).
// 상태:
//   로딩         → 안내 카드
//   에러         → 에러 메시지 (TRANSFER4001은 본인 아님·미존재·미지원 유형 모호 매핑이라 단일 메시지)
//   정상         → 확인증 카드 + QR (mock UI 유지) + 저장 버튼(미구현, 다음 사이클)
// ─────────────────────────────────────────────────────────────

import { useNavigate, useParams } from 'react-router-dom';
import { ApiException } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useReceipt } from '@/hooks/useReceipt';
import styles from './TransferReceiptPage.module.css';

/** 통화 기호 — 거래내역과 동일 (백엔드 응답에 기호 없음). */
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  VND: '₫',
  PHP: '₱',
};
const currencySymbol = (code: string) => CURRENCY_SYMBOL[code] ?? `${code} `;

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: '완료',
  PENDING: '대기',
  PROCESSING: '처리중',
  FAILED: '실패',
  CANCELLED: '취소',
};

/** 거래(출금) 금액 표시. KRW/VND는 소수 0, USD/PHP는 소수 2자리(0 끝자리 제거). */
function formatAmount(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return `${currencySymbol(currencyCode)}${amount}`;
  const noDecimals = currencyCode === 'KRW' || currencyCode === 'VND';
  return `${currencySymbol(currencyCode)}${n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: noDecimals ? 0 : 2,
  })}`;
}

/** 수수료 표시. 0이면 "없음". */
function formatFee(fee: string, currencyCode: string): string {
  const n = Number(fee);
  if (Number.isNaN(n) || n === 0) return '없음';
  return formatAmount(fee, currencyCode);
}

/** ISO 8601 UTC Z → "YYYY.MM.DD HH:mm" (사용자 로컬 타임존). */
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${hh}:${mm}`;
}

export default function TransferReceiptPage() {
  const navigate = useNavigate();
  const { transferPublicId = '' } = useParams<{ transferPublicId: string }>();
  const { data, isLoading, error } = useReceipt(transferPublicId);

  // 본인 아님·미존재·미지원 유형은 모두 TRANSFER4001로 모호 매핑(cross-user 노출 방지) — 단일 메시지.
  const errorMessage =
    error instanceof ApiException
      ? error.code === 'TRANSFER4001'
        ? '송금 확인증을 찾을 수 없습니다.'
        : error.message || '확인증을 불러오지 못했습니다.'
      : error
        ? '확인증을 불러오지 못했습니다.'
        : null;

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

      {isLoading ? (
        <div className={styles.receipt}>
          <div className={styles.receiptHead}>
            <div className={styles.receiptTitle}>불러오는 중...</div>
          </div>
        </div>
      ) : errorMessage ? (
        <div className={styles.receipt} role="alert">
          <div className={styles.receiptHead}>
            <div className={styles.receiptTitle}>{errorMessage}</div>
          </div>
        </div>
      ) : data ? (
        <ReceiptBody data={data} />
      ) : null}

      <div className={styles.btnCol}>
        <button type="button" className={styles.primaryBtn} disabled>
          이미지로 저장하기
        </button>
        <button type="button" className={styles.secondaryBtn} disabled>
          PDF로 저장하기
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => navigate('/')}>
          홈으로 돌아가기
        </button>
      </div>
    </>
  );
}

/**
 * 확인증 본문 — 응답 데이터를 받아 카드 + 행 + QR 영역을 렌더.
 * 별도 컴포넌트로 분리한 이유: 로딩/에러 분기와 시각적으로 격리(if 트리 가독성), data 비-null 보장.
 */
function ReceiptBody({ data }: { data: NonNullable<ReturnType<typeof useReceipt>['data']> }) {
  // type 추론(api-spec §7-1): bank_name이 있으면 해외 송금(REMITTANCE), 없으면 앱 사용자 송금(INTERNAL).
  const isRemittance = Boolean(data.bank_name);
  const method = isRemittance ? '해외 계좌 송금' : '앱 사용자 송금';
  const statusLabel = STATUS_LABEL[data.status] ?? data.status;
  const isCompleted = data.status === 'COMPLETED';

  // 행 정의 — [라벨, 값, isBlue?] 튜플. null/undefined인 값은 '-' 표시.
  // REMITTANCE 한정 행(은행/계좌)은 INTERNAL일 땐 배열에서 제외해 행 자체가 안 보이게 한다.
  type Row = [string, string, boolean?];
  const rows: Row[] = [
    ['거래번호', data.public_id],
    ['송금일시', formatDateTime(data.created_at)],
    ['보낸 사람', data.sender_name ?? '-'],
    ['받는 사람', data.receiver_name ?? '-'],
    ['송금 방식', method],
    ...(isRemittance
      ? ([
          ['수취 은행', data.bank_name ?? '-'],
          ['수취 계좌', data.account_number ?? '-'],
        ] as Row[])
      : []),
    ['송금 통화', data.currency_code],
    ['송금 금액', formatAmount(data.amount, data.currency_code)],
    ['수수료', formatFee(data.fee, data.currency_code)],
    // 다통화(REMITTANCE 등)일 때만 환율·수취금액·수취통화 표시 — same-currency는 amount와 동일이라 노이즈.
    ...(data.exchange_rate
      ? ([
          ['적용 환율', data.exchange_rate],
          ['수취 금액', formatAmount(data.receive_amount, data.receive_currency_code)],
          ['수취 통화', data.receive_currency_code],
        ] as Row[])
      : []),
    ['상태', statusLabel, isCompleted],
  ];

  return (
    <>
      <div className={styles.receipt}>
        <div className={styles.receiptHead}>
          <div className={styles.stamp}>{isCompleted ? '✓' : '!'}</div>
          <div className={styles.receiptTitle}>
            {isCompleted ? '송금 완료 확인증' : `송금 ${statusLabel} 확인증`}
          </div>
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
    </>
  );
}
