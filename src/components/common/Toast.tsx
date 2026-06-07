import { useEffect } from 'react';
import styles from './Toast.module.css';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastProps {
  /** 표시할 메시지. null/빈 문자열이면 렌더 안 함. */
  message: string | null;
  /** 톤(기본 success). */
  variant?: ToastVariant;
  /** 자동 사라지는 ms (기본 2200). 0 이하면 자동 닫기 비활성(수동 close만). */
  duration?: number;
  /** 닫힐 때 호출. */
  onClose: () => void;
}

/**
 * 화면 하단 토스트 (Toss/카카오페이 패턴) — 짧은 성공·에러 피드백용.
 *
 * <p>{@link ConfirmDialog}는 사용자의 결정을 기다리는 동기적 확인용이고,
 * 이건 결과만 알리는 비동기적 피드백용. 동일 화면에 둘 다 떠도 OK(z-index 분리).
 *
 * <p>마운트 시 duration ms 뒤 onClose가 호출된다. message가 바뀌면 타이머는 다시 시작.
 *
 * @example
 *   const [toast, setToast] = useState<{msg: string; variant?: ToastVariant} | null>(null);
 *   ...
 *   <Toast
 *     message={toast?.msg ?? null}
 *     variant={toast?.variant}
 *     onClose={() => setToast(null)}
 *   />
 */
export default function Toast({
  message,
  variant = 'success',
  duration = 2200,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (!message || duration <= 0) return;
    const id = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(id);
  }, [message, duration, onClose]);

  if (!message) return null;

  const variantClass =
    variant === 'error' ? styles.error : variant === 'info' ? styles.info : styles.success;

  return (
    <div className={`${styles.toast} ${variantClass}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
