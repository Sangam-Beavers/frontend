import styles from './Pagination.module.css';

interface PaginationProps {
  /** 현재 페이지 (0부터). */
  page: number;
  /** 전체 페이지 수 (서버 응답 total_pages). */
  totalPages: number;
  /** 페이지 이동 콜백 (0부터). */
  onChange: (page: number) => void;
}

/** 한 번에 보여줄 페이지 번호 개수. */
const WINDOW = 5;

/**
 * 페이지 번호 페이지네이션 — `‹ 1 2 3 4 5 ›`.
 *
 * <p>내부 계산은 0-index, 표시는 1-index. 현재 페이지를 가운데 두는 윈도우를 보여주고
 * 끝에 가까우면 한쪽으로 채운다. 페이지가 1개 이하면 렌더하지 않는다.
 */
export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // 현재 페이지를 가운데 두는 [start, end) 윈도우 계산.
  const half = Math.floor(WINDOW / 2);
  const end = Math.min(totalPages, Math.max(page - half, 0) + WINDOW);
  const start = Math.max(0, end - WINDOW);
  const pages = Array.from({ length: end - start }, (_, i) => start + i);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <nav className={styles.pagination} aria-label="페이지 이동">
      <button
        type="button"
        className={styles.arrow}
        disabled={!canPrev}
        aria-label="이전 페이지"
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`${styles.page} ${p === page ? styles.active : ''}`}
          aria-current={p === page ? 'page' : undefined}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}

      <button
        type="button"
        className={styles.arrow}
        disabled={!canNext}
        aria-label="다음 페이지"
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </nav>
  );
}
