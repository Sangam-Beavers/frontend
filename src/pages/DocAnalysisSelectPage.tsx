import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './DocAnalysisSelectPage.module.css';

const DOC_TYPES = ['거소증명서', '급여명세서', '고용계약서'] as const;
type DocType = (typeof DOC_TYPES)[number];

const RECENT = [
  { title: '거소증명서', meta: '업로드 완료 · 2026.05.13' },
  { title: '급여명세서', meta: '분석 완료 · 2026.05.10' },
];

export default function DocAnalysisSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DocType | null>(null);

  const goPreview = () => navigate('/doc-analysis/preview', { state: { docType: selected } });

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="AI 문서 분석" showBack={false} />

        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>문서를 업로드하세요</div>
          <div className={styles.cardText}>
            거소증명서, 급여명세서, 고용계약서를 AI가 다국어로 분석합니다.
          </div>
        </div>

        <div className={styles.grid2}>
          {DOC_TYPES.slice(0, 2).map((t) => (
            <div
              key={t}
              className={`${styles.card} ${styles.typeCard} ${selected === t ? styles.typeCardActive : ''}`}
              onClick={() => setSelected(t)}
            >
              <div className={styles.typeIcon}>📄</div>
              <div className={styles.cardTitle}>{t}</div>
            </div>
          ))}
        </div>

        <div
          className={`${styles.card} ${styles.typeCard} ${selected === '고용계약서' ? styles.typeCardActive : ''}`}
          onClick={() => setSelected('고용계약서')}
        >
          <div className={styles.typeRow}>
            <div className={styles.typeIcon}>📝</div>
            <div className={styles.cardTitle}>고용계약서</div>
          </div>
        </div>

        <div className={styles.btnRow}>
          <button
            type="button"
            className={styles.secondaryBtn}
            disabled={!selected}
            onClick={goPreview}
          >
            카메라 촬영
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!selected}
            onClick={goPreview}
          >
            파일 업로드
          </button>
        </div>

        <div className={styles.section}>최근 분석 내역</div>

        <div className={styles.list}>
          {RECENT.map((item, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{item.title}</div>
                <div className={styles.itemMeta}>{item.meta}</div>
              </div>
              <span className={styles.pill}>완료</span>
            </div>
          ))}
        </div>
      </div>

      <BottomNav activeIndex={1} />
    </div>
  );
}
