export interface RecentDoc {
  title: string;
  meta: string;
}

export interface DocAnalysisIssue {
  title: string;
  meta: string;
}

export const RECENT_DOCS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { title: '거소증명서', meta: '업로드 완료 · 2026.05.13' },
    { title: '급여명세서', meta: '분석 완료 · 2026.05.10' },
  ] as RecentDoc[],
};

export const DOC_ANALYSIS_ISSUES_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    { title: '임금 분석', meta: '최저임금보다 낮을 가능성' },
    { title: '근로시간', meta: '초과근무 관련 확인 필요' },
  ] as DocAnalysisIssue[],
};
