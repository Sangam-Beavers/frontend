import { useEffect, useRef, useState } from 'react';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  /** 스플래시 종료(언마운트) 콜백. */
  onFinish: () => void;
  /** 페이드아웃 시작 전 표시 시간(ms). 기본 1600ms. */
  duration?: number;
}

const FADE_MS = 450;

/**
 * 앱 첫 진입 스플래시. 브랜드 그라데이션 위로 로고가 팝업·플로팅되고, 이름/태그라인이 순차 페이드업한다.
 * {@code duration} 후 페이드아웃하며 {@code onFinish}로 언마운트를 알린다. 순수 CSS 애니메이션.
 */
export default function SplashScreen({ onFinish, duration = 1600 }: SplashScreenProps) {
  const [leaving, setLeaving] = useState(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), duration);
    const done = setTimeout(() => onFinishRef.current(), duration + FADE_MS);
    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [duration]);

  return (
    <div
      className={`${styles.splash} ${leaving ? styles.leaving : ''}`}
      role="status"
      aria-label="Global Bridge"
    >
      <div className={styles.logoCard}>
        <img className={styles.logo} src="/logo.png" alt="" />
      </div>
      <div className={styles.brand}>Global Bridge</div>
      <div className={styles.tagline}>외국인 노동자를 위한 금융 커뮤니티</div>
      <div className={styles.dots} aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
