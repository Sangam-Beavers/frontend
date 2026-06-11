import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GradeUpCelebration.module.css';

interface GradeUpCelebrationProps {
  /** 달성한 등급명(이미 i18n 변환된 라벨). 축하 메시지 본문에 들어간다. */
  gradeName: string;
  /** 자동/수동 dismiss 시 호출 — 부모가 표시 상태를 내린다. */
  onDismiss: () => void;
  /** 자동 dismiss까지의 ms (기본 2800). 0 이하면 자동 닫기 비활성(탭으로만 닫힘). */
  duration?: number;
}

const CONFETTI_COUNT = 28;
const CONFETTI_COLORS = ['#16a34a', '#0b66ff', '#7c3aed', '#f59e0b', '#ec4899'];

/**
 * 등급 상승 축하 모먼트 (Phase 3) — 컨페티 + 중앙 카드를 1회 띄우고 자동으로 사라진다.
 *
 * <p>MyPage 진입 시 lastSeen 등급과 현재 등급을 비교해 상승했을 때만 마운트된다(표시 판정은 부모 책임).
 * 외부 컨페티 라이브러리 없이 CSS 애니메이션만 사용한다(의존성 추가 회피, CLAUDE.md).
 * 모션 민감 사용자는 {@code prefers-reduced-motion}으로 컨페티가 꺼지고 카드만 정적으로 보인다.
 *
 * @example
 *   {celebrating && (
 *     <GradeUpCelebration gradeName={trustGradeLabel} onDismiss={() => setCelebrating(false)} />
 *   )}
 */
export default function GradeUpCelebration({
  gradeName,
  onDismiss,
  duration = 2800,
}: GradeUpCelebrationProps) {
  const { t } = useTranslation();

  // 컨페티 조각은 마운트 시 1회만 생성 — 리렌더마다 위치가 튀지 않도록 고정한다.
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delayMs: Math.random() * 400,
        durationMs: 2200 + Math.random() * 1200,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    []
  );

  // duration 뒤 자동 dismiss. duration이 바뀌면 타이머 재설정.
  useEffect(() => {
    if (duration <= 0) return;
    const id = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(id);
  }, [duration, onDismiss]);

  return (
    <div className={styles.overlay} role="status" aria-live="polite" onClick={onDismiss}>
      <div className={styles.confettiLayer} aria-hidden="true">
        {pieces.map((p) => (
          <span
            key={p.id}
            className={styles.confetti}
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delayMs}ms`,
              animationDuration: `${p.durationMs}ms`,
            }}
          />
        ))}
      </div>
      <div className={styles.card}>
        <div className={styles.emoji}>🎉</div>
        <div className={styles.title}>{t('trust.celebrate.title')}</div>
        <div className={styles.message}>{t('trust.celebrate.message', { grade: gradeName })}</div>
      </div>
    </div>
  );
}
