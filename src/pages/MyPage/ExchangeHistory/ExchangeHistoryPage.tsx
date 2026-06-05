// ─────────────────────────────────────────────────────────────
// pages/MyPage/ExchangeHistory/ExchangeHistoryPage.tsx — 환전 내역 목록 + 단건 상세 모달
//
// 데이터: useExchangeHistory(page, size) → walletApi.getExchanges
//   - 백엔드 응답에 단건 상세 필드가 다 포함돼 있어, 행 클릭 시 추가 API 호출 없이 모달에서 바로 표시.
//   - walletApi.getExchange(publicId)는 향후 직접 URL 접근용으로 surface는 유지(현재 미사용).
//
// 상태:
//   로딩         → 안내 카드
//   빈 결과      → "환전 내역이 없습니다"
//   에러         → 에러 메시지 (AUTH4011은 apiClient interceptor가 로그인 화면으로 이동)
//   정상         → 리스트 + 페이지네이션 (prev/next 버튼)
//   행 클릭      → 단건 상세 모달 (배경 클릭/ESC/X 버튼으로 닫기)
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { ApiException, type ExchangeResponse } from '@/api';
import TopBar from '@/components/navigation/TopBar';
import { useExchangeHistory } from '@/hooks/useExchangeHistory';
import styles from './ExchangeHistoryPage.module.css';

const PAGE_SIZE = 20;

// 통화 기호 — Complete 화면과 동일 (백엔드 응답에 기호 없음).
const CURRENCY_SYMBOL: Record<string, string> = {
  KRW: '₩',
  USD: '$',
  PHP: '₱',
  VND: '₫',
};

function formatAmount(currency: string, amount: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? '';
  const num = Number(amount);
  if (currency === 'KRW') return `${symbol}${num.toLocaleString()}`;
  return `${symbol}${num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  })}`;
}

// "2026-05-26T05:30:00Z" → "2026.05.26"
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = formatDate(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${date} ${hh}:${mm}`;
}

export default function ExchangeHistoryPage() {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<ExchangeResponse | null>(null);
  const { data, isLoading, isFetching, error } = useExchangeHistory(page, PAGE_SIZE);

  // 모달 열려있을 때 ESC로 닫기
  useEffect(() => {
    if (!selected) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selected]);

  const totalPages = data?.total_pages ?? 0;
  const totalElements = data?.total_elements ?? 0;
  const items = data?.exchanges ?? [];

  const errorMessage =
    error instanceof ApiException
      ? error.message || '환전 내역을 불러오지 못했습니다.'
      : error
        ? '환전 내역을 불러오지 못했습니다.'
        : null;

  return (
    <>
      <TopBar title="환전 내역" />

      {isLoading ? (
        <div className={styles.stateCard}>불러오는 중...</div>
      ) : errorMessage ? (
        <div className={styles.stateCard} role="alert">
          {errorMessage}
        </div>
      ) : items.length === 0 ? (
        <div className={styles.stateCard}>환전 내역이 없습니다.</div>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((tx) => {
              const fromTo = `${tx.from_currency_code} → ${tx.to_currency_code}`;
              const meta = `${formatAmount(tx.from_currency_code, tx.amount)} → ${formatAmount(
                tx.to_currency_code,
                tx.receive_amount
              )} · 환율 ${Number(tx.exchange_rate).toLocaleString()}${
                tx.exchange_type === 'RE_EXCHANGE' ? ' · 재환전' : ''
              }`;
              return (
                <button
                  key={tx.public_id}
                  type="button"
                  className={styles.item}
                  onClick={() => setSelected(tx)}
                >
                  <div className={styles.itemMain}>
                    <div className={styles.itemTitle}>{fromTo}</div>
                    <div className={styles.itemMeta}>{meta}</div>
                  </div>
                  <span className={styles.date}>{formatDate(tx.exchanged_at)}</span>
                </button>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === 0 || isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                이전
              </button>
              <span className={styles.pageInfo}>
                {page + 1} / {totalPages} (총 {totalElements}건)
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages - 1 || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div className={styles.modalBackdrop} onClick={() => setSelected(null)} role="presentation">
          <div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="환전 상세"
          >
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>
                {selected.exchange_type === 'RE_EXCHANGE' ? '재환전 상세' : '환전 상세'}
              </span>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelected(null)}
                aria-label="닫기"
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}>
                <span>출금</span>
                <b>
                  {formatAmount(selected.from_currency_code, selected.amount)}{' '}
                  {selected.from_currency_code}
                </b>
              </div>
              <div className={styles.modalRow}>
                <span>입금</span>
                <b>
                  {formatAmount(selected.to_currency_code, selected.receive_amount)}{' '}
                  {selected.to_currency_code}
                </b>
              </div>
              <div className={styles.modalRow}>
                <span>적용 환율</span>
                <b>1 = ₩{Number(selected.exchange_rate).toLocaleString()}</b>
              </div>
              <div className={styles.modalRow}>
                <span>수수료</span>
                <b>₩{Number(selected.fee).toLocaleString()}</b>
              </div>
              <div className={styles.modalRow}>
                <span>상태</span>
                <b>{selected.status}</b>
              </div>
              <div className={styles.modalRow}>
                <span>일시</span>
                <b>{formatDateTime(selected.exchanged_at)}</b>
              </div>
              <div className={styles.modalIdRow}>
                <span>거래 ID</span>
                <code className={styles.modalId}>{selected.public_id}</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
