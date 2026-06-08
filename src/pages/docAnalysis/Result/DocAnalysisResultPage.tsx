import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import TopBar from '@/components/navigation/TopBar';
import { ChatbotEntryButton, ChatbotSheet } from '@/components/chat';
import { ApiException, documentApi } from '@/api';
import type { RiskLevelCode } from '@/api/document';
import styles from './DocAnalysisResultPage.module.css';

// 백엔드 dev seed의 완료문서 ID — publicId 없이 직접 진입했을 때(개발 중 새로고침 등) 폴백.
// 정상 플로우(제출→로딩→결과)에서는 Loading 페이지가 documentPublicId를 state로 넘겨준다.
// dev 빌드 전용 — 프로덕션에선 폴백 없이 시작 화면으로 돌려보낸다(아래 가드).
const DEV_FALLBACK_DOCUMENT_ID = import.meta.env.DEV
  ? '00000000-0000-0000-0000-000000000001'
  : undefined;

/** 종합 위험 등급별 결론 카드 i18n 키 매핑. null(등급 미산출)은 PARTIAL 등 예외 케이스. */
const VERDICT_KEYS: Record<RiskLevelCode, { titleKey: string; textKey: string }> = {
  HIGH: { titleKey: 'doc.result.verdict.high.title', textKey: 'doc.result.verdict.high.text' },
  MEDIUM: {
    titleKey: 'doc.result.verdict.medium.title',
    textKey: 'doc.result.verdict.medium.text',
  },
  LOW: { titleKey: 'doc.result.verdict.low.title', textKey: 'doc.result.verdict.low.text' },
};

export default function DocAnalysisResultPage() {
  const { t } = useTranslation();
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
    queryFn: () => documentApi.getResult(documentPublicId!),
    enabled: !!documentPublicId,
  });

  const riskItems = result?.risk_items ?? [];
  const verdict = result?.overall_risk_level ? VERDICT_KEYS[result.overall_risk_level] : null;
  // 결과 미생성(ANALYZING 중 진입 등) — 백엔드가 COMMON4221(422)로 응답.
  const notReady = error instanceof ApiException && error.code === 'COMMON4221';

  // 진입 가드 — 결과 페이지는 "분석 완료 + 결과 적재" 상태에서만 머문다.
  // ① publicId 없이 직접 진입(URL 입력 등): 조회 대상이 없으므로 분석 시작 화면으로.
  // ② 결과 미생성(422): 아직 분석 중 — 로딩(폴링) 화면으로 돌려보내 완료 시 다시 넘어오게 한다.
  useEffect(() => {
    if (!documentPublicId) {
      navigate('/doc-analysis', { replace: true });
    } else if (notReady) {
      navigate('/doc-analysis/loading', {
        replace: true,
        state: { publicId: documentPublicId },
      });
    }
  }, [documentPublicId, notReady, navigate]);

  // 챗봇 시트 초기 화면의 추천 질문 — 분석에서 나온 위험 항목 기반.
  const suggestedTopics = riskItems.map((item) => ({
    title: item.clause,
    meta: item.description,
  }));

  // 가드 useEffect가 리다이렉트할 때까지 빈 화면 — 폴백 ID로 잘못 렌더링되는 것 방지.
  if (!documentPublicId) return null;

  return (
    <div className={styles.pageWrapper}>
      <TopBar title={t('doc.result.title')} onBack={() => navigate(-1)} />

      {/* ① 결론 — 메인 결과 강조 */}
      {isPending && (
        <div className={`${styles.card} ${styles.cardWarn}`}>
          <div className={styles.cardTitle}>{t('doc.result.loadingTitle')}</div>
          <div className={styles.cardText}>{t('doc.result.loadingText')}</div>
        </div>
      )}
      {error && (
        <div className={`${styles.card} ${styles.cardWarn}`} role="alert">
          <div className={styles.cardTitle}>
            {notReady ? t('doc.result.notReadyTitle') : t('doc.result.loadErrorTitle')}
          </div>
          <div className={styles.cardText}>
            {notReady
              ? t('doc.result.notReadyText')
              : (error instanceof ApiException && error.message) || t('doc.result.retryLater')}
          </div>
        </div>
      )}
      {result && (
        <div
          className={`${styles.card} ${result.overall_risk_level === 'LOW' ? '' : styles.cardDanger}`}
        >
          <div className={styles.cardTitle}>
            {verdict ? t(verdict.titleKey) : t('doc.result.verdict.partial.title')}
          </div>
          <div className={styles.cardText}>
            {verdict ? t(verdict.textKey) : t('doc.result.verdict.partial.text')}
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
                {item.risk_level === 'HIGH' ? t('doc.result.risk') : t('doc.result.warning')}
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
              <div className={styles.itemTitle}>{t('doc.result.monthlyWage')}</div>
              <div className={styles.itemMeta}>
                {Number(result.wage_summary.monthly_wage).toLocaleString()}{' '}
                {result.wage_summary.currency_code}
              </div>
            </div>
          </div>
          <div className={styles.item}>
            <div className={styles.itemMain}>
              <div className={styles.itemTitle}>{t('doc.result.hourlyWage')}</div>
              <div className={styles.itemMeta}>
                {Number(result.wage_summary.hourly_wage).toLocaleString()}{' '}
                {result.wage_summary.currency_code}
              </div>
            </div>
          </div>
          {result.wage_summary.deductions.map((d, i) => (
            <div key={i} className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemTitle}>
                  {t('doc.result.deduction', { name: d.name })}
                </div>
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
          {t('doc.result.saveExport')}
        </button>
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={() => navigate('/community/write')}
        >
          {t('doc.result.shareCommunity')}
        </button>
      </div>

      {/* ⑤ 작은 disclaimer — 큰 카드에서 축소된 안내. 전문가 상담 카드 바로 위에 둠 */}
      <p className={styles.disclaimer}>
        <span className={styles.disclaimerIcon} aria-hidden>
          ℹ️
        </span>
        {t('doc.result.disclaimer')}
      </p>

      {/* ⑥ 인간 에스컬레이션 */}
      <div className={`${styles.card} ${styles.cardPurple} ${styles.expertCard}`}>
        <div className={styles.cardTitle}>{t('doc.result.expertTitle')}</div>
        <button type="button" className={styles.secondaryBtn}>
          {t('doc.result.expertCta')}
        </button>
      </div>

      {/* 바텀시트 — 진입 버튼이 누르면 store.isOpen=true → 슬라이드 업.
          시트 초기 화면에 도구 4종 안내 + 분석 결과 기반 추천 질문 노출. */}
      <ChatbotSheet suggestedTopics={suggestedTopics} />
    </div>
  );
}
