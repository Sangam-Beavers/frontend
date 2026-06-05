import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { DOC_TYPES, type DocType } from '@/constants/docTypes';
import { RECENT_DOCS_MOCK } from '@/mocks/docAnalysisMock';
import { useDocAnalysisStore } from '@/stores/docAnalysisStore';
import styles from './DocAnalysisSelectPage.module.css';

const RECENT = RECENT_DOCS_MOCK.result;

export default function DocAnalysisSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DocType | null>(null);
  const setDocImage = useDocAnalysisStore((s) => s.setDocImage);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // 같은 파일 재선택 가능하도록 초기화
    if (!file) return;
    setDocImage(file);
    navigate('/doc-analysis/preview', { state: { docType: selected } });
  };

  return (
    <>
      <TopBar title="AI 문서 분석" showBack={false} />

      <div className={`${styles.card} ${styles.cardInfo}`}>
        <div className={styles.cardTitle}>문서를 업로드하세요</div>
        <div className={styles.cardText}>
          근로계약서, 급여명세서, 고용계약서를 AI가 다국어로 분석합니다.
        </div>
      </div>

      <select
        className={styles.select}
        value={selected ?? ''}
        onChange={(e) => setSelected(e.target.value as DocType)}
      >
        <option value="" disabled>
          문서 종류 선택
        </option>
        {DOC_TYPES.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleImageSelect}
      />
      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageSelect} />

      <div className={styles.btnRow}>
        <button
          type="button"
          className={styles.secondaryBtn}
          disabled={!selected}
          onClick={() => cameraInputRef.current?.click()}
        >
          카메라 촬영
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={!selected}
          onClick={() => fileInputRef.current?.click()}
        >
          이미지 업로드
        </button>
      </div>

      <div className={styles.section}>최근 분석 내역</div>

      <div className={styles.list}>
        {RECENT.map((item, i) => (
          <div
            key={i}
            className={styles.item}
            onClick={() => navigate('/mypage/doc-analysis-history')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.itemMeta}>{item.meta}</div>
            </div>
            <span className={styles.pill}>완료</span>
          </div>
        ))}
      </div>
    </>
  );
}
