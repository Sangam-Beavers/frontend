import { apiClient } from './client';

/**
 * document-service API 호출 함수 모음 (문서 분석 제출/상태 폴링/결과 조회/재요청).
 *
 * - 모두 인증 필요 — interceptor가 토큰 자동 부착.
 * - 응답 타입은 wallet.ts와 동일하게 인라인 snake_case로 작성한다. 자동 생성 타입은
 *   SpringDoc 기본 camelCase라 실제 응답 snake_case와 미스매치 (api/README.md §2 참고).
 * - 챗봇 SSE는 raw fetch + ReadableStream을 써야 해서 `api/chat.ts` 에 별도로 분리되어 있다.
 */

// ─────────────── 공통 enum (백엔드 SSOT) ───────────────

export type AnalysisDocumentType = 'LABOR_CONTRACT' | 'PAYSLIP' | 'EMPLOYMENT_CONTRACT';

/** 진행 상태 폴링 응답의 status — 3단계만 노출. */
export type DocumentStatus = 'ANALYZING' | 'COMPLETED' | 'FAILED';

/** 결과 응답의 processing_status — PARTIAL 포함. */
export type ProcessingStatus = 'COMPLETED' | 'FAILED' | 'PARTIAL';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

// ─────────────── 요청/응답 DTO ───────────────

/** POST /documents 요청 본문. */
export interface SubmitRequest {
  analysis_document_type: AnalysisDocumentType;
  file_name: string;
}

/** POST /documents 응답 (201). 이 응답을 받아 upload_url로 파일을 PUT 한다. */
export interface SubmissionResponse {
  public_id: string;
  status: DocumentStatus;
  /** Pre-signed PUT URL. retry 응답에서는 null. */
  upload_url: string | null;
  /** PUT 업로드 시 그대로 함께 보내야 하는 서명 헤더(이름+값). retry 응답에서는 null. */
  upload_headers: Record<string, string> | null;
  /** uploadUrl 만료 시각 ISO 8601 UTC Z. retry 응답에서는 null. */
  expires_at: string | null;
}

/** GET /documents/{publicId}/status 응답. 프론트 폴링 전용 가벼운 페이로드. */
export interface DocumentStatusResponse {
  public_id: string;
  status: DocumentStatus;
  /** ANALYZING 일 때 안내용 고정값. 완료/실패면 0. */
  estimated_minutes: number;
}

export interface DeductionDto {
  name: string;
  amount: string;
}

export interface WageSummaryDto {
  currency_code: string;
  monthly_wage: string;
  hourly_wage: string;
  deductions: DeductionDto[];
}

export interface RiskItemDto {
  risk_level: RiskLevel | string;
  clause: string;
  description: string;
}

/** GET /documents/{publicId}/result 응답. ANALYZING 상태에서 호출 시 422(COMMON4221). */
export interface DocumentResultResponse {
  document_public_id: string;
  analysis_document_type: AnalysisDocumentType;
  processing_status: ProcessingStatus;
  overall_risk_level: RiskLevel | null;
  ocr_confidence: number;
  wage_summary: WageSummaryDto | null;
  risk_items: RiskItemDto[];
  translated_text: string | null;
  translated_lang: string | null;
  masked_file_url: string | null;
  failed_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────── API 함수 ───────────────

export const documentApi = {
  /**
   * 분석 요청 생성 — public_id + S3 Pre-signed PUT URL 발급.
   *
   * 받은 응답으로 곧바로 {@link uploadFileToS3} 호출해 원본을 업로드해야 분석이 시작된다.
   * Pre-signed URL은 약 10분 유효.
   */
  submit: (body: SubmitRequest) => apiClient.post<unknown, SubmissionResponse>('/documents', body),

  /**
   * Pre-signed PUT URL에 원본 파일을 업로드.
   *
   * <p>이건 백엔드가 아니라 S3에 직접 PUT 하는 호출이라 apiClient(axios baseURL=/api/v1)를 안 쓴다.
   * Authorization 헤더가 붙으면 안 되므로(서명 충돌) raw fetch + 백엔드가 준 headers 그대로 사용.
   *
   * @throws Error S3가 4xx/5xx 응답한 경우 — 호출 측에서 사용자에게 안내 처리.
   */
  uploadFileToS3: async (
    uploadUrl: string,
    uploadHeaders: Record<string, string>,
    file: File
  ): Promise<void> => {
    const res = await fetch(uploadUrl, {
      method: 'PUT',
      headers: uploadHeaders,
      body: file,
    });
    if (!res.ok) {
      throw new Error(`파일 업로드에 실패했습니다. (HTTP ${res.status})`);
    }
  },

  /** 분석 진행 상태 조회. Loading 화면에서 폴링용. */
  getStatus: (publicId: string) =>
    apiClient.get<unknown, DocumentStatusResponse>(`/documents/${publicId}/status`),

  /**
   * 분석 결과 상세 조회.
   *
   * <p>아직 분석 중이면 백엔드가 422(`COMMON4221`)로 응답 → ApiException으로 throw됨.
   * 호출 측은 status === 'COMPLETED' 확인 후 호출하면 안전.
   */
  getResult: (publicId: string) =>
    apiClient.get<unknown, DocumentResultResponse>(`/documents/${publicId}/result`),

  /**
   * 분석 재요청 — FAILED 상태일 때만 가능(S3 원본 재사용). 그 외 422.
   * 응답 SubmissionResponse의 upload_url 등은 null이고 status만 ANALYZING으로 전환된다.
   */
  retry: (publicId: string) =>
    apiClient.post<unknown, SubmissionResponse>(`/documents/${publicId}/retry`, {}),
};
