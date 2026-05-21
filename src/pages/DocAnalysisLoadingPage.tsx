import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './DocAnalysisLoadingPage.module.css';

const STEPS = [
  { label: '문서 업로드 완료', done: true },
  { label: 'OCR 변환 중', done: true },
  { label: 'AI 내용 분석', done: false },
  { label: '다국어 번역', done: false },
  { label: '결과 정리', done: false },
];

export default function DocAnalysisLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { docType } = (location.state as { docType?: string }) ?? {};

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/doc-analysis/result', { state: { docType } });
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate, docType]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="AI 분석 중" onBack={() => navigate(-1)} />

        <div className={styles.preview}>
          <span className={styles.previewIcon}>🖼️</span>
          <span className={styles.previewLabel}>{docType ?? '문서'} 이미지</span>
        </div>

        <div className={styles.steps}>
          {STEPS.map((step, i) => (
            <div key={i} className={styles.step}>
              <span className={`${styles.dot} ${step.done ? '' : styles.dotOff}`}>{i + 1}</span>
              <span className={`${styles.stepLabel} ${step.done ? styles.stepActive : ''}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>분석 중입니다</div>
          <div className={styles.cardText}>잠시만 기다려주세요.</div>
        </div>
      </div>

      <BottomNav activeIndex={1} />
    </div>
  );
}
