import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ApiException, documentApi } from '@/api';
import { DOC_TYPE_TO_ENUM, type DocType } from '@/constants/docTypes';
import { useDocAnalysisStore } from '@/stores/docAnalysisStore';
import styles from './DocAnalysisPreviewPage.module.css';

export default function DocAnalysisPreviewPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { docType } = (location.state as { docType?: DocType }) ?? {};
  const docImage = useDocAnalysisStore((s) => s.docImage);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const imageUrl = useMemo(() => (docImage ? URL.createObjectURL(docImage) : null), [docImage]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  /**
   * 분석 시작 — ① POST /documents로 Pre-signed URL 발급 ② S3 직접 PUT 업로드
   * ③ publicId를 들고 Loading 페이지로 이동(상태 폴링 시작).
   * 업로드까지 성공해야 이동한다 — 업로드 실패 시 S3 트리거가 없어 분석이 영원히 안 돈다.
   */
  const handleStartAnalysis = async () => {
    if (!docImage || !docType || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const submission = await documentApi.submit({
        analysis_document_type: DOC_TYPE_TO_ENUM[docType],
        file_name: docImage.name,
      });
      if (!submission.upload_url || !submission.upload_headers) {
        // submit 정상 응답이면 항상 채워진다(null은 retry 응답 전용) — 방어 코드.
        throw new ApiException('INVALID_SUBMISSION', 0, '업로드 URL 발급에 실패했습니다.');
      }
      await documentApi.uploadToS3(submission.upload_url, submission.upload_headers, docImage);
      navigate('/doc-analysis/loading', {
        state: { docType, publicId: submission.public_id },
      });
    } catch (e) {
      setErrorMsg(
        e instanceof ApiException ? e.message : '분석 요청에 실패했습니다. 다시 시도해주세요.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <TopBar title="업로드 이미지 확인" onBack={() => navigate(-1)} />

      <div className={styles.preview}>
        {imageUrl ? (
          <img
            className={styles.previewImage}
            src={imageUrl}
            alt={docType ? `${docType} 이미지` : '업로드된 문서 이미지'}
          />
        ) : (
          <div className={styles.previewInner}>
            <span className={styles.previewIcon}>🖼️</span>
            <p className={styles.previewLabel}>
              {docType ? `${docType} 이미지` : '업로드된 문서 이미지'}
            </p>
            <p className={styles.previewHint}>
              이미지를 확인해주세요. 이미지가 흐릿하거나 잘렸다면 다시 업로드하세요.
            </p>
          </div>
        )}
      </div>

      <div className={`${styles.card} ${styles.cardWarn}`}>
        <div className={styles.cardTitle}>분석 전 확인</div>
        <div className={styles.cardText}>
          이미지가 흐리거나 일부가 잘렸다면 다시 업로드하세요. 확인 후 분석을 시작합니다.
        </div>
      </div>

      {errorMsg && (
        <div className={`${styles.card} ${styles.cardWarn}`} role="alert">
          <div className={styles.cardTitle}>분석을 시작하지 못했어요</div>
          <div className={styles.cardText}>{errorMsg}</div>
        </div>
      )}

      <div className={styles.btnRow}>
        <button
          type="button"
          className={styles.ghostBtn}
          disabled={submitting}
          onClick={() => navigate(-1)}
        >
          다시 업로드
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={submitting || !docImage || !docType}
          onClick={handleStartAnalysis}
        >
          {submitting ? '업로드 중…' : '이 이미지로 분석 시작'}
        </button>
      </div>
    </>
  );
}
