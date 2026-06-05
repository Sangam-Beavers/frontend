import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ChatbotEntryButton, ChatbotSheet } from '@/components/chat';
import { ApiException } from '@/api';
import type { DocumentResultResponse, RiskItemDto } from '@/api';
import { useDocumentResult } from '@/hooks/useDocumentResult';
import styles from './DocAnalysisResultPage.module.css';

// 백엔드 dev seed의 완료문서 ID. 분석 요청 → 결과 화면으로 publicId가 전달되는 흐름이
// 정착되기 전까지 폴백으로 사용한다 (docs/document-analysis/api-spec §3, ai-chatbot-mcp.md).
// TODO: 분석 제출 응답에서 받은 publicId를 router state로 넘겨받아 우선 사용.
const DEV_FALLBACK_DOCUMENT_ID = '00000000-0000-0000-0000-000000000001';

// 위험도(risk_level) 별 한국어 라벨 + 스타일 분기.
const RISK_LABEL: Record<string, { label: string; className: string }> = {
  HIGH: { label: '경고', className: 'pillDanger' },
  MEDIUM: { label: '주의', className: 'pillWarn' },
  LOW: { label: '확인', className: 'pillInfo' },
};

export default function DocAnalysisResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const documentPublicId =
    (location.state as { documentPublicId?: string } | null)?.documentPublicId ??
    DEV_FALLBACK_DOCUMENT_ID;

  // 분석 결과 실데이터 조회 — DB seed(`...0001`)가 들어있으면 그대로 받아온다.
  const { data: result, isLoading, error } = useDocumentResult(documentPublicId);

  // 챗봇 시트에 넘길 추천 질문 토픽 — 실 risk_items에서 매핑.
  const suggestedTopics = useMemo(
    () =>
      (result?.risk_items ?? []).map((item) => ({
        title: item.clause,
        meta: item.description,
      })),
    [result?.risk_items]
  );

  // 분석이 완료된 상태(COMPLETED/PARTIAL)일 때만 챗봇 활성화 — 아직 결과가 없으면 안내.
  const isChatReady =
    result?.processing_status === 'COMPLETED' || result?.processing_status === 'PARTIAL';

  return (
    <div className={styles.pageWrapper}>
      <TopBar title="분석 결과" onBack={() => navigate(-1)} />

      {isLoading && <ResultLoading />}

      {error && <ResultError error={error} />}

      {result && (
        <>
          {/* ① 결론 */}
          <ResultHeadline result={result} />

          {/* ② 근거 — 이슈 리스트 (실 risk_items) */}
          {result.risk_items.length > 0 ? (
            <div className={styles.list}>
              {result.risk_items.map((item, i) => (
                <RiskListItem key={`${item.clause}-${i}`} item={item} />
              ))}
            </div>
          ) : (
            <div className={`${styles.card}`}>
              <div className={styles.cardText}>특별히 발견된 위험 항목이 없어요.</div>
            </div>
          )}

          {/* ③ 챗봇 CTA — 분석 완료 상태일 때만 활성화 */}
          <div className={styles.ctaWrap}>
            {isChatReady ? (
              <ChatbotEntryButton documentPublicId={documentPublicId} />
            ) : (
              <button type="button" className={styles.ctaDisabled} disabled>
                🤖 분석이 끝나면 챗봇을 쓸 수 있어요
              </button>
            )}
          </div>

          {/* ④ 보조 액션 */}
          <div className={styles.btnRow}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => navigate('/mypage/doc-analysis-history')}
            >
              저장 내보내기
            </button>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => navigate('/community/write')}
            >
              커뮤니티 공유
            </button>
          </div>

          {/* ⑤ Disclaimer */}
          <p className={styles.disclaimer}>
            <span className={styles.disclaimerIcon} aria-hidden>
              ℹ️
            </span>
            AI 분석 결과는 참고용이며 모든 상황을 반영하지 못할 수 있어요. 중요한 판단은 전문가와
            함께하세요.
          </p>

          {/* ⑥ 인간 에스컬레이션 */}
          <div className={`${styles.card} ${styles.cardPurple} ${styles.expertCard}`}>
            <div className={styles.cardTitle}>전문가 상담</div>
            <button type="button" className={styles.secondaryBtn}>
              바로 알아보기
            </button>
          </div>
        </>
      )}

      {/* 바텀시트는 항상 마운트(전역 상태). 시트 안에 분석 결과 기반 추천 질문 전달. */}
      <ChatbotSheet suggestedTopics={suggestedTopics} />
    </div>
  );
}

// ─────────────── 서브 컴포넌트 ───────────────

function ResultHeadline({ result }: { result: DocumentResultResponse }) {
  const status = result.processing_status;
  if (status === 'FAILED') {
    return (
      <div className={`${styles.card} ${styles.cardDanger}`}>
        <div className={styles.cardTitle}>분석 실패</div>
        <div className={styles.cardText}>
          {result.failed_reason ?? '분석 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.'}
        </div>
      </div>
    );
  }

  // COMPLETED / PARTIAL — overall_risk_level 별 헤드라인.
  const risk = result.overall_risk_level;
  const headline =
    risk === 'HIGH'
      ? '검토가 필요해요'
      : risk === 'MEDIUM'
        ? '몇 가지 확인할 점이 있어요'
        : '특이사항 없이 안전해 보여요';
  const body =
    risk === 'HIGH'
      ? '임금과 근로시간 적절성을 꼭 확인하세요.'
      : risk === 'MEDIUM'
        ? '아래 항목을 가볍게 확인해보세요.'
        : '큰 문제는 발견되지 않았어요.';

  return (
    <div className={`${styles.card} ${risk === 'HIGH' ? styles.cardDanger : styles.cardSoft}`}>
      <div className={styles.cardTitle}>{headline}</div>
      <div className={styles.cardText}>{body}</div>
    </div>
  );
}

function RiskListItem({ item }: { item: RiskItemDto }) {
  const meta = RISK_LABEL[item.risk_level] ?? { label: '확인', className: 'pillInfo' };
  return (
    <div className={styles.item}>
      <div className={styles.itemMain}>
        <div className={styles.itemTitle}>{item.clause}</div>
        <div className={styles.itemMeta}>{item.description}</div>
      </div>
      <span className={styles[meta.className]}>{meta.label}</span>
    </div>
  );
}

function ResultLoading() {
  return (
    <div className={`${styles.card} ${styles.stateCard}`}>
      <div className={styles.cardTitle}>분석 결과 불러오는 중…</div>
      <div className={styles.cardText}>잠시만 기다려주세요.</div>
    </div>
  );
}

function ResultError({ error }: { error: ApiException | Error }) {
  // 백엔드가 분석 미완료 시 422 + COMMON4221로 응답.
  const isAnalyzing = error instanceof ApiException && error.code === 'COMMON4221';
  if (isAnalyzing) {
    return (
      <div className={`${styles.card} ${styles.stateCard}`}>
        <div className={styles.cardTitle}>아직 분석 중이에요</div>
        <div className={styles.cardText}>
          분석이 완료되면 결과를 확인할 수 있어요. 잠시 후 다시 들어와주세요.
        </div>
      </div>
    );
  }
  const isNotFound = error instanceof ApiException && error.code === 'DOCUMENT4001';
  return (
    <div className={`${styles.card} ${styles.cardDanger}`}>
      <div className={styles.cardTitle}>
        {isNotFound ? '문서를 찾을 수 없어요' : '결과를 불러오지 못했어요'}
      </div>
      <div className={styles.cardText}>{error.message}</div>
    </div>
  );
}
