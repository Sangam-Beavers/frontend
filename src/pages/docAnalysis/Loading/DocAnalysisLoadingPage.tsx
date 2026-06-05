import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { documentApi } from '@/api';
import styles from './DocAnalysisLoadingPage.module.css';

const STEPS = [
  { label: '문서 업로드 완료', done: true },
  { label: 'OCR 변환 중', done: true },
  { label: 'AI 내용 분석', done: false },
  { label: '다국어 번역', done: false },
  { label: '결과 정리', done: false },
];

/** 상태 폴링 주기(ms). 분석이 분 단위로 걸려 과한 폴링은 불필요. */
const POLL_INTERVAL_MS = 5_000;

export default function DocAnalysisLoadingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { docType, publicId } = (location.state as { docType?: string; publicId?: string }) ?? {};

  // publicId 없이 직접 진입(URL 직접 입력 등)하면 폴링 대상이 없으므로 처음으로 돌려보낸다.
  useEffect(() => {
    if (!publicId) navigate('/doc-analysis', { replace: true });
  }, [publicId, navigate]);

  // 상태 폴링 — ANALYZING 동안만 주기 재조회, 종료 상태(COMPLETED/FAILED)면 중단.
  const { data: status, error } = useQuery({
    queryKey: ['documentStatus', publicId],
    queryFn: () => documentApi.getStatus(publicId!),
    enabled: !!publicId,
    refetchInterval: (query) =>
      query.state.data?.status === 'ANALYZING' ? POLL_INTERVAL_MS : false,
  });

  // 완료되면 결과 페이지로. replace — 뒤로가기로 로딩 화면에 다시 들어오지 않도록.
  useEffect(() => {
    if (status?.status === 'COMPLETED') {
      navigate('/doc-analysis/result', {
        replace: true,
        state: { docType, documentPublicId: publicId },
      });
    }
  }, [status, navigate, docType, publicId]);

  // 폴링 중 일시적 오류(네트워크 등)는 실패로 보지 않는다 — 마지막 상태가 ANALYZING이면
  // refetchInterval이 유지돼 다음 폴링 성공 시 자체 회복된다. 에러를 실패로 취급하는 건
  // 마지막 상태가 없거나(첫 조회 실패) 종료 상태일 때만.
  const failed = status?.status === 'FAILED' || (!!error && status?.status !== 'ANALYZING');

  return (
    <>
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

      {failed ? (
        <div className={`${styles.card} ${styles.cardInfo}`} role="alert">
          <div className={styles.cardTitle}>분석에 실패했어요</div>
          <div className={styles.cardText}>
            {error ? '상태 확인 중 오류가 발생했습니다.' : '문서 분석에 실패했습니다.'} 처음
            화면에서 다시 시도해주세요.
          </div>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => navigate('/doc-analysis', { replace: true })}
          >
            처음으로 돌아가기
          </button>
        </div>
      ) : (
        <div className={`${styles.card} ${styles.cardInfo}`}>
          <div className={styles.cardTitle}>분석 중입니다</div>
          <div className={styles.cardText}>
            {status?.estimated_minutes
              ? `예상 소요 시간 약 ${status.estimated_minutes}분 — 잠시만 기다려주세요.`
              : '잠시만 기다려주세요.'}
          </div>
        </div>
      )}
    </>
  );
}
