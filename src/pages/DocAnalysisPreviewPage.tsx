import { useLocation, useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import TopBar from '@/components/TopBar';
import styles from './DocAnalysisPreviewPage.module.css';

export default function DocAnalysisPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { docType } = (location.state as { docType?: string }) ?? {};

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <TopBar title="업로드 이미지 확인" onBack={() => navigate(-1)} />

        <div className={styles.preview}>
          <div className={styles.previewInner}>
            <span className={styles.previewIcon}>🖼️</span>
            <p className={styles.previewLabel}>
              {docType ? `${docType} 이미지` : '업로드된 문서 이미지'}
            </p>
            <p className={styles.previewHint}>
              이미지를 확인해주세요. 이미지가 흐릿하거나 잘렸다면 다시 업로드하세요.
            </p>
          </div>
        </div>

        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>분석 전 확인</div>
          <div className={styles.cardText}>
            이미지가 흐리거나 일부가 잘렸다면 다시 업로드하세요. 확인 후 분석을 시작합니다.
          </div>
        </div>

        <div className={styles.btnRow}>
          <button type="button" className={styles.ghostBtn} onClick={() => navigate(-1)}>
            다시 업로드
          </button>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => navigate('/doc-analysis/loading', { state: { docType } })}
          >
            이 이미지로 분석 시작
          </button>
        </div>
      </div>

      <BottomNav activeIndex={1} />
    </div>
  );
}
