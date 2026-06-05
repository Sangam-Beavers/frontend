import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  /** 제목(선택). */
  title?: string;
  /** 본문 메시지. */
  message: string;
  /** 확인 버튼 라벨. */
  confirmLabel?: string;
  /** 취소 버튼 라벨. */
  cancelLabel?: string;
  /** 위험 동작(삭제 등) — 확인 버튼을 빨강으로. */
  danger?: boolean;
  /** 처리 중 — 버튼 비활성 + 확인 라벨에 "중…" 표기. */
  loading?: boolean;
  /** 처리 실패 메시지(선택). */
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 공용 확인 팝업 — MobileScreen(position: relative) 안을 덮는 백드롭 + 가운데 카드.
 *
 * <p>백드롭/취소 클릭 시 onCancel, 확인 클릭 시 onConfirm. loading 동안에는 닫기·확인 비활성.
 * 위험 동작은 danger로 확인 버튼을 빨강 처리한다.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const handleBackdrop = () => {
    if (!loading) onCancel();
  };

  return (
    <div className={styles.backdrop} role="presentation" onClick={handleBackdrop}>
      <div
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-label={title ?? message}
        onClick={(event) => event.stopPropagation()}
      >
        {title && <div className={styles.title}>{title}</div>}
        <div className={styles.message}>{message}</div>
        {error && <div className={styles.error}>{error}</div>}
        <div className={styles.btnRow}>
          <button type="button" className={styles.cancelBtn} disabled={loading} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${danger ? styles.danger : ''}`}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? `${confirmLabel} 중…` : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
