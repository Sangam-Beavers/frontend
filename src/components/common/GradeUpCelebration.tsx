import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './GradeUpCelebration.module.css';

interface GradeUpCelebrationProps {
  /** 달성한 등급명 (이미 번역된 문자열, 예: "인증 비버"). */
  gradeName: string;
  /** 축하 애니메이션 종료 후 호출 (부모가 상태를 false로 바꿔야 재표시 가능). */
  onDismiss: () => void;
}

const PARTICLE_COLORS = [
  '#f59e0b',
  '#22c55e',
  '#2563eb',
  '#7c3aed',
  '#ec4899',
  '#f97316',
  '#06b6d4',
  '#eab308',
];

/** 컨페티 파티클 수 */
const PARTICLE_COUNT = 28;

/**
 * 등급 상승 축하 모먼트 — 컨페티 + 토스트 (비버 캐릭터 없음).
 *
 * 마운트 시 바로 애니메이션 시작, 약 3초 뒤 onDismiss 호출.
 * 부모는 `celebrating && <GradeUpCelebration ... />` 패턴으로 조건 렌더한다.
 */
export default function GradeUpCelebration({ gradeName, onDismiss }: GradeUpCelebrationProps) {
  const { t } = useTranslation();
  const dismissedRef = useRef(false);

  useEffect(() => {
    dismissedRef.current = false;
    const id = window.setTimeout(() => {
      if (!dismissedRef.current) {
        dismissedRef.current = true;
        onDismiss();
      }
    }, 3000);
    return () => window.clearTimeout(id);
  }, [onDismiss]);

  // 파티클 배열 — 랜덤 위치·색·딜레이 (SSR 없는 CSR 앱이라 Math.random 안전)
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    key: i,
    color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
    left: `${5 + ((i * 3.3) % 90)}%`,
    delay: `${(i * 55) % 800}ms`,
    size: `${6 + (i % 4) * 2}px`,
    rotate: `${(i * 37) % 360}deg`,
  }));

  return (
    <>
      {/* 컨페티 오버레이 */}
      <div className={styles.overlay} aria-hidden="true">
        {particles.map((p) => (
          <span
            key={p.key}
            className={styles.particle}
            style={{
              left: p.left,
              top: '-10px',
              width: p.size,
              height: p.size,
              background: p.color,
              animationDelay: p.delay,
              transform: `rotate(${p.rotate})`,
            }}
          />
        ))}
      </div>

      {/* 등급 상승 토스트 */}
      <div className={styles.toast} role="status" aria-live="polite">
        <div className={styles.toastTitle}>{t('trust.celebrate.title')}</div>
        <div className={styles.toastMessage}>
          {t('trust.celebrate.message', { grade: gradeName })}
        </div>
      </div>
    </>
  );
}
