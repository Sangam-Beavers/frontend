import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { DOC_TYPES, type DocType } from '@/constants/docTypes';
import { useDocAnalysisStore } from '@/stores/docAnalysisStore';
import { useDocuments } from '@/hooks/useDocuments';
import { docDateLabel, docStatusLabel, docTypeLabel } from '@/utils/docAnalysisDisplay';
import styles from './DocAnalysisSelectPage.module.css';

// 최근 분석 내역 표시 건수 — 전체 목록은 MyPage 분석 이력에서 확인.
const RECENT_SIZE = 3;

export default function DocAnalysisSelectPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<DocType | null>(null);
  // document_submissions + document_results join 목록 (최근순).
  // 실패(FAILED) 내역은 서버 status 필터로 숨긴다 — History 페이지와 동일 정책.
  const { data: documents } = useDocuments(0, RECENT_SIZE, ['ANALYZING', 'COMPLETED']);
  const recent = documents?.content ?? [];
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
        {recent.length === 0 && (
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemMeta}>아직 분석한 문서가 없어요.</div>
            </div>
          </div>
        )}
        {recent.map((item) => (
          <div
            key={item.public_id}
            className={styles.item}
            onClick={() =>
              // 완료 문서는 바로 해당 결과로, 그 외(분석 중/실패)는 이력 페이지로.
              item.status === 'COMPLETED'
                ? navigate('/doc-analysis/result', {
                    state: { documentPublicId: item.public_id },
                  })
                : navigate('/mypage/doc-analysis-history')
            }
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{docTypeLabel(item)}</div>
              <div className={styles.itemMeta}>
                {item.file_name} · {docDateLabel(item.created_at)}
              </div>
            </div>
            <span className={styles.pill}>{docStatusLabel(item)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
