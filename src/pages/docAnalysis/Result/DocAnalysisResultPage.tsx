import { useLocation, useNavigate } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { ChatbotEntryButton, ChatbotSheet } from '@/components/chat';
import { DOC_ANALYSIS_ISSUES_MOCK } from '@/mocks/docAnalysisMock';
import styles from './DocAnalysisResultPage.module.css';

const ISSUES = DOC_ANALYSIS_ISSUES_MOCK.result;

// 백엔드 ChatController dev seed의 완료문서 ID(ai-chatbot-mcp.md 참조).
// 실제 라우팅이 /doc-analysis/result/:publicId 형태로 정착되기 전까지 폴백으로 사용한다.
// TODO: 분석 제출 응답에서 받은 publicId를 router state로 넘겨 받아 사용하도록 교체.
const DEV_FALLBACK_DOCUMENT_ID = '00000000-0000-0000-0000-000000000001';

export default function DocAnalysisResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const documentPublicId =
    (location.state as { documentPublicId?: string } | null)?.documentPublicId ??
    DEV_FALLBACK_DOCUMENT_ID;

  return (
    <div className={styles.pageWrapper}>
      <TopBar title="분석 결과" onBack={() => navigate(-1)} />

      {/* ① 결론 — 메인 결과 강조 */}
      <div className={`${styles.card} ${styles.cardDanger}`}>
        <div className={styles.cardTitle}>최종 판단: 검토 필요</div>
        <div className={styles.cardText}>임금과 근로시간 적절성을 확인하세요.</div>
      </div>

      {/* ② 근거 — 이슈 리스트 */}
      <div className={styles.list}>
        {ISSUES.map((item, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{item.title}</div>
              <div className={styles.itemMeta}>{item.meta}</div>
            </div>
            <span className={styles.pillWarn}>경고</span>
          </div>
        ))}
      </div>

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
      <ChatbotSheet suggestedTopics={ISSUES} />
    </div>
  );
}
