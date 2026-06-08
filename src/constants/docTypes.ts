// 고용계약서(EMPLOYMENT_CONTRACT)는 더 이상 신규 분석 대상이 아니라 선택 목록에서 제외.
export const DOC_TYPES = ['근로계약서', '급여명세서'] as const;

export type DocType = (typeof DOC_TYPES)[number];

/** 백엔드 AnalysisDocumentType enum (gb-backend document-service SSOT). */
export type AnalysisDocumentType = 'LABOR_CONTRACT' | 'PAYSLIP' | 'EMPLOYMENT_CONTRACT';

/** 화면 한글 라벨 → 백엔드 enum 매핑. POST /api/v1/documents 요청 시 변환에 사용. */
export const DOC_TYPE_TO_ENUM: Record<DocType, AnalysisDocumentType> = {
  근로계약서: 'LABOR_CONTRACT',
  급여명세서: 'PAYSLIP',
};

/**
 * 백엔드 enum → 화면 한글 라벨 (결과/목록 표시용 역매핑).
 * 고용계약서는 신규 분석은 막았지만 과거 이력 표시를 위해 매핑은 유지한다.
 */
export const ENUM_TO_DOC_TYPE: Record<AnalysisDocumentType, string> = {
  LABOR_CONTRACT: '근로계약서',
  PAYSLIP: '급여명세서',
  EMPLOYMENT_CONTRACT: '고용계약서',
};
