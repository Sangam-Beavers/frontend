import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { documentApi } from '@/api';
import styles from './DocAnalysisLoadingPage.module.css';

/**
 * 진행 단계. 실제 파이프라인(업로드 → Lambda A 추출/마스킹 → Lambda B 분석+번역 → 결과)과
 * 1:1 대응. 백엔드 status는 ANALYZING/COMPLETED/FAILED뿐이라 중간 위치는 알 수 없으므로,
 * startAt(예상 시간 대비 시작 비율)로 경과 시간 기반 추정 표시한다.
 * 1단계(업로드)는 이 페이지 진입 자체가 완료 증거라 startAt 0 + 즉시 완료.
 */
const STEPS = [
  { label: '문서 업로드', startAt: 0 },
  { label: '텍스트 추출 · 개인정보 보호 처리', startAt: 0 },
  { label: 'AI 분석 및 번역', startAt: 0.3 },
  { label: '결과 정리', startAt: 0.85 },
];

/** 상태 폴링 주기(ms). 분석이 분 단위로 걸려 과한 폴링은 불필요. */
const POLL_INTERVAL_MS = 5_000;

/** estimated_minutes가 아직 없을 때(첫 폴링 전) 쓰는 기본 예상 시간. */
const DEFAULT_ESTIMATED_MINUTES = 3;

/** 단계 표시용 경과 시간 갱신 주기(ms). */
const TICK_MS = 1_000;

/** 단계 상태 → 점/라벨 CSS 클래스 매핑. */
const DOT_CLASS = {
  done: styles.dotDone,
  active: styles.dotActive,
  failed: styles.dotFailed,
  pending: styles.dotOff,
} as const;

const LABEL_CLASS = {
  done: styles.stepDone,
  active: styles.stepActive,
  failed: styles.stepFailed,
  pending: '',
} as const;

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

  // 경과 시간 — 단계 추정 표시용. 페이지 진입 시점부터 1초 간격 갱신.
  // 종료 상태(실패/완료)면 타이머를 멈춰 단계 표시를 동결한다 — 실패 표시가
  // 시간이 흐른다고 다음 단계로 옮겨가면 안 되므로.
  const [startedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);
  const terminal = failed || status?.status === 'COMPLETED';
  useEffect(() => {
    if (terminal) return;
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), TICK_MS);
    return () => clearInterval(id);
  }, [terminal, startedAt]);

  // 예상 시간 대비 진행 비율로 현재 단계 추정. startAt을 지난 마지막 단계가 "진행 중",
  // 그 이전은 완료. 예상보다 오래 걸려도 마지막 단계에서 멈춰 대기한다(거짓 완료 금지) —
  // 실제 완료/실패는 폴링 status로만 확정.
  const estimatedMs = (status?.estimated_minutes ?? DEFAULT_ESTIMATED_MINUTES) * 60_000;
  const progress = elapsedMs / estimatedMs;
  const currentStep = STEPS.reduce((acc, step, i) => (progress >= step.startAt ? i : acc), 0);

  /** 단계별 시각 상태. 실패 시 진행 중이던 단계를 실패로 표시. */
  const stepState = (i: number): 'done' | 'active' | 'failed' | 'pending' => {
    if (status?.status === 'COMPLETED') return 'done';
    if (i < currentStep) return 'done';
    if (i > currentStep) return 'pending';
    return failed ? 'failed' : 'active';
  };

  return (
    <>
      <TopBar title="AI 분석 중" onBack={() => navigate(-1)} />

      <div className={styles.preview}>
        <span className={styles.previewIcon}>🖼️</span>
        <span className={styles.previewLabel}>{docType ?? '문서'} 이미지</span>
      </div>

      <div className={styles.steps}>
        {STEPS.map((step, i) => {
          const state = stepState(i);
          return (
            <div key={i} className={styles.step}>
              <span className={`${styles.dot} ${DOT_CLASS[state]}`}>
                {state === 'done' ? '✓' : state === 'failed' ? '!' : i + 1}
              </span>
              <span className={`${styles.stepLabel} ${LABEL_CLASS[state]}`}>{step.label}</span>
            </div>
          );
        })}
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
