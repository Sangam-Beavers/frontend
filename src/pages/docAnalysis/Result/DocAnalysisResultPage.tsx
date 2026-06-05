import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import TopBar from '@/components/navigation/TopBar';
import { ChatbotEntryButton, ChatbotSheet } from '@/components/chat';
import { ApiException, documentApi } from '@/api';
import type { RiskLevelCode } from '@/api/document';
import styles from './DocAnalysisResultPage.module.css';

// 백엔드 dev seed의 완료문서 ID — publicId 없이 직접 진입했을 때(개발 중 새로고침 등) 폴백.
// 정상 플로우(제출→로딩→결과)에서는 Loading 페이지가 documentPublicId를 state로 넘겨준다.
const DEV_FALLBACK_DOCUMENT_ID = '00000000-0000-0000-0000-000000000001';

/** 종합 위험 등급별 결론 카드 문구. null(등급 미산출)은 PARTIAL 등 예외 케이스. */
const VERDICT: Record<RiskLevelCode, { title: string; text: string }> = {
  HIGH: { title: '최종 판단: 검토 필요', text: '위험 항목이 발견됐어요. 아래 근거를 확인하세요.' },
  MEDIUM: {
    title: '최종 판단: 주의',
    text: '확인이 필요한 항목이 있어요. 아래 근거를 확인하세요.',
  },
  LOW: { title: '최종 판단: 양호', text: '특별한 위험 항목이 발견되지 않았어요.' },
};

export default function DocAnalysisResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const documentPublicId =
    (location.state as { documentPublicId?: string } | null)?.documentPublicId ??
    DEV_FALLBACK_DOCUMENT_ID;

  const {
    data: result,
    error,
    isPending,
  } = useQuery({
    queryKey: ['documentResult', documentPublicId],
    queryFn: () => documentApi.getResult(documentPublicId),
  });

  const riskItems = result?.risk_items ?? [];
  const verdict = result?.overall_risk_level ? VERDICT[result.overall_risk_level] : null;
  // 결과 미생성(ANALYZING 중 진입 등) — 백엔드가 COMMON4221(422)로 응답.
  const notReady = error instanceof ApiException && error.code === 'COMMON4221';

  // 챗봇 시트 초기 화면의 추천 질문 — 분석에서 나온 위험 항목 기반.
  const suggestedTopics = riskItems.map((item) => ({
    title: item.clause,
    meta: item.description,
  }));

  return (
    <div className={styles.pageWrapper}>
      <TopBar title="분석 결과" onBack={() => navigate(-1)} />

      {/* ① 결론 — 메인 결과 강조 */}
      {isPending && (
        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>결과를 불러오는 중…</div>
          <div className={styles.cardText}>잠시만 기다려주세요.</div>
        </div>
      )}
      {error && (
        <div className={`${styles.card} ${styles.cardWarn}`} role="alert">
          <div className={styles.cardTitle}>
            {notReady ? '분석이 아직 완료되지 않았어요' : '결과를 불러오지 못했어요'}
          </div>
          <div className={styles.cardText}>
            {notReady
              ? '분석이 끝나면 다시 확인해주세요.'
              : (error instanceof ApiException && error.message) || '잠시 후 다시 시도해주세요.'}
          </div>
        </div>
      )}
      {result && (
        <div
          className={`${styles.card} ${result.overall_risk_level === 'LOW' ? '' : styles.cardDanger}`}
        >
          <div className={styles.cardTitle}>{verdict?.title ?? '최종 판단: 부분 분석'}</div>
          <div className={styles.cardText}>
            {verdict?.text ?? '일부 항목만 분석에 성공했어요. 결과를 참고용으로만 활용하세요.'}
          </div>
        </div>
      )}

      {/* ② 근거 — 분석에서 나온 위험 항목 리스트 */}
      {riskItems.length > 0 && (
        <div className={styles.list}>
          {riskItems.map((item, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>{item.clause}</div>
                <div className={styles.itemMeta}>{item.description}</div>
              </div>
              <span className={styles.pillWarn}>
                {item.risk_level === 'HIGH' ? '위험' : '경고'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ②-1 급여 요약 (근로계약서/급여명세서 분석 시) */}
      {result?.wage_summary && (
        <div className={styles.list}>
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>월급</div>
              <div className={styles.itemMeta}>
                {Number(result.wage_summary.monthly_wage).toLocaleString()}{' '}
                {result.wage_summary.currency_code}
              </div>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>시급</div>
              <div className={styles.itemMeta}>
                {Number(result.wage_summary.hourly_wage).toLocaleString()}{' '}
                {result.wage_summary.currency_code}
              </div>
            </div>
          </div>
          {result.wage_summary.deductions.map((d, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>공제: {d.name}</div>
                <div className={styles.itemMeta}>
                  {Number(d.amount).toLocaleString()} {result.wage_summary!.currency_code}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ③ 주요 다음 단계 — 챗봇 진입 (분석 결과 보고 → 추가 질문) */}
      <div className={styles.ctaWrap}>
        <ChatbotEntryButton documentPublicId={documentPublicId} />
      </div>

      {/* ④ 보조 액션 — 저장/공유 */}
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

      {/* ⑤ 작은 disclaimer — 큰 카드에서 축소된 안내. 전문가 상담 카드 바로 위에 둠 */}
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

      {/* 바텀시트 — 진입 버튼이 누르면 store.isOpen=true → 슬라이드 업.
          시트 초기 화면에 도구 4종 안내 + 분석 결과 기반 추천 질문 노출. */}
      <ChatbotSheet suggestedTopics={suggestedTopics} />
    </div>
  );
}
