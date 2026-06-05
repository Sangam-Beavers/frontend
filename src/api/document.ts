import { apiClient, ApiException } from './client';
import type { AnalysisDocumentType } from '@/constants/docTypes';

/**
 * document-service API 호출 함수 모음 (문서 분석 제출·S3 업로드·상태 폴링·결과 조회·목록·재요청).
 *
 * - 모두 인증 필요(JWT) — interceptor가 토큰 자동 부착.
 *   백엔드 DocumentController는 @CurrentUserPublicId(JWT claim public_id) 전환 완료 상태라
 *   X-User-Public-Id 헤더는 보내지 않는다 (OpenAPI 자동생성 타입의 헤더 표기는 구버전).
 * - 응답 타입은 인라인 snake_case로 작성한다 (wallet.ts와 동일 사유 — 백엔드 Jackson
 *   SNAKE_CASE 전역 설정. SpringDoc 자동 생성 타입은 camelCase라 실제 응답과 미스매치).
 * - 챗봇 SSE는 chat.ts 참고 (fetch + ReadableStream).
 *
 * 전체 플로우: submit(Pre-signed URL 발급) → uploadToS3(브라우저가 S3 직접 PUT)
 *            → getStatus 폴링(ANALYZING→COMPLETED/FAILED) → getResult.
 * 분석 자체는 별도 AWS 계정의 Lambda(OCR+마스킹 → 법령 RAG 분석)에서 비동기로 돈다.
 */

// ---------- Request / Response 타입 (인라인, 백엔드 명세 기준 snake_case) ----------

/** 문서 제출 후 분석 상태 (백엔드 DocumentStatus enum SSOT). */
export type DocumentStatusCode = 'ANALYZING' | 'COMPLETED' | 'FAILED';

/** 분석 결과 처리 상태 (백엔드 ProcessingStatus enum SSOT). PARTIAL = 일부 항목만 성공. */
export type ProcessingStatusCode = 'COMPLETED' | 'FAILED' | 'PARTIAL';

/** 종합 위험 등급 (백엔드 RiskLevel enum SSOT). */
export type RiskLevelCode = 'LOW' | 'MEDIUM' | 'HIGH';

/** 분석 요청 body (POST /documents). file_name은 경로 구분자·제어문자 금지(백엔드 검증). */
export interface SubmitDocumentRequest {
  analysis_document_type: AnalysisDocumentType;
  file_name: string;
}

/** 분석 요청/재요청 응답. upload_url 계열은 retry 응답에서 null. */
export interface SubmissionResponse {
  /** 분석 요청 식별자 — 이후 상태/결과/챗봇 호출에 사용. */
  public_id: string;
  status: DocumentStatusCode;
  /** S3 Pre-signed PUT URL (약 10분 유효). */
  upload_url: string | null;
  /**
   * uploadToS3 호출 시 그대로 함께 보내야 하는 헤더(이름+값).
   * Pre-signed 서명에 포함돼 있어 누락/변경 시 S3가 403을 반환한다.
   */
  upload_headers: Record<string, string> | null;
  /** upload_url 만료 시각 (ISO 8601 UTC Z). */
  expires_at: string | null;
}

/** 상태 폴링 응답 (GET /documents/{publicId}/status). */
export interface DocumentStatusResponse {
  public_id: string;
  status: DocumentStatusCode;
  /** 분석 중일 때 표시할 예상 남은 분(고정값). 완료/실패면 0. */
  estimated_minutes: number;
}

/** 공제 항목 한 건. 금액은 string 십진수(팀 규약 — 금액은 string 전송). */
export interface DeductionItem {
  name: string;
  amount: string;
}

/** 급여 요약 (근로계약서/급여명세서 분석 시). */
export interface WageSummary {
  currency_code: string;
  monthly_wage: string;
  hourly_wage: string;
  deductions: DeductionItem[];
}

/** 위험 항목 한 건 — 문제 조항과 설명. */
export interface RiskItem {
  risk_level: string;
  clause: string;
  description: string;
}

/** 분석 결과 상세 응답 (GET /documents/{publicId}/result). */
export interface DocumentResultResponse {
  document_public_id: string;
  analysis_document_type: AnalysisDocumentType;
  processing_status: ProcessingStatusCode;
  overall_risk_level: RiskLevelCode | null;
  /** OCR 신뢰도(0~1). 표시 전용 number. */
  ocr_confidence: number | null;
  wage_summary: WageSummary | null;
  risk_items: RiskItem[] | null;
  /** 모국어 번역문. */
  translated_text: string | null;
  translated_lang: string | null;
  /** PII 마스킹본 S3 presigned GET URL. */
  masked_file_url: string | null;
  failed_reason: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** 목록 한 항목 (GET /documents). overall_risk_level은 document_results join 값 — 결과 미생성이면 null. */
export interface DocumentSummaryItem {
  public_id: string;
  analysis_document_type: AnalysisDocumentType;
  file_name: string;
  status: DocumentStatusCode;
  overall_risk_level: RiskLevelCode | null;
  created_at: string;
}

/**
 * 목록 응답 — 백엔드가 Spring Page를 그대로 반환(전역 SNAKE_CASE 직렬화).
 * 프론트에서 쓰는 필드만 타입에 둔다 (pageable/sort 등 메타는 생략).
 */
export interface DocumentListResponse {
  content: DocumentSummaryItem[];
  total_elements: number;
  total_pages: number;
  /** 현재 페이지 번호(0부터). */
  number: number;
  size: number;
}

// ---------- API 함수 ----------

export const documentApi = {
  /**
   * 문서 분석 요청 (201) — 분석 레코드 생성 + S3 Pre-signed PUT URL 발급.
   *
   * <p>응답의 upload_url로 {@link uploadToS3}를 호출해야 실제 분석이 시작된다
   * (S3 ObjectCreated 트리거). URL은 약 10분 유효 — 만료 후엔 새로 submit.
   *
   * <p>검증 실패(파일명 형식 등) COMMON4001(400), 인증 AUTH4011(401) → ApiException.
   */
  submit: (body: SubmitDocumentRequest) =>
    apiClient.post<unknown, SubmissionResponse>('/documents', body),

  /**
   * S3 원본 직접 업로드 — submit 응답의 Pre-signed URL로 브라우저가 직접 PUT.
   *
   * <p>apiClient(axios)를 쓰지 않는 이유: ① interceptor가 Authorization 헤더를 붙이면
   * Pre-signed 서명과 불일치 ② baseURL(/api/v1)이 아닌 절대 URL ③ envelope 파싱 불필요.
   * upload_headers는 서명에 포함돼 있으므로 가공 없이 그대로 전송한다.
   */
  uploadToS3: async (
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
      throw new ApiException(
        'S3_UPLOAD_FAILED',
        res.status,
        `파일 업로드에 실패했습니다 (HTTP ${res.status}). 다시 시도해주세요.`
      );
    }
  },

  /**
   * 분석 진행 상태 조회 (200) — 프론트 폴링용 가벼운 엔드포인트.
   *
   * <p>Loading 페이지에서 React Query refetchInterval로 주기 호출,
   * status가 COMPLETED/FAILED가 되면 폴링을 멈춘다.
   *
   * <p>없는 문서 DOCUMENT4001(404), 남의 문서 COMMON4031(403) → ApiException.
   */
  getStatus: (publicId: string) =>
    apiClient.get<unknown, DocumentStatusResponse>(`/documents/${publicId}/status`),

  /**
   * 분석 결과 상세 조회 (200) — 완료(또는 PARTIAL) 문서의 위험 항목·급여 요약·번역문.
   *
   * <p>결과가 아직 없으면(ANALYZING) COMMON4221(422) → ApiException(code 'COMMON4221')로
   * 분기해 "분석 진행 중" 안내를 띄운다. 없는 문서 DOCUMENT4001(404), 권한 COMMON4031(403).
   */
  getResult: (publicId: string) =>
    apiClient.get<unknown, DocumentResultResponse>(`/documents/${publicId}/result`),

  /**
   * 내 분석 요청 목록 조회 (200) — 최근순(createdAt DESC) 페이지 조회.
   *
   * <p>Select 페이지 최근 분석 내역·MyPage 분석 이력에서 사용. overall_risk_level은
   * document_results join 값이라 완료 문서만 채워진다.
   *
   * <p>statuses로 서버 상태 필터(api-spec §4) — 실패 내역 숨김 시 ['ANALYZING', 'COMPLETED'].
   * 콤마 구분 단일 파라미터로 보낸다(Spring이 List로 변환). 잘못된 값은 COMMON4001(400).
   *
   * @param page 0부터 시작하는 페이지 번호
   * @param size 페이지당 건수 (백엔드 기본 20)
   * @param statuses 상태 필터 (생략 시 전체)
   */
  list: (page = 0, size = 20, statuses?: DocumentStatusCode[]) =>
    apiClient.get<unknown, DocumentListResponse>('/documents', {
      // 빈 배열이면 status= (빈 값)이 전송돼 백엔드 enum 변환이 COMMON4001로 실패한다.
      // undefined로 두면 axios가 파라미터 자체를 생략 — 전체 조회와 동일하게 동작.
      params: { page, size, status: statuses?.length ? statuses.join(',') : undefined },
    }),

  /**
   * 분석 재요청 (200) — FAILED 상태일 때만 가능(S3 원본 재사용). 그 외 422(COMMON4221).
   * 응답 SubmissionResponse의 upload_url 계열은 null이고 status만 ANALYZING으로 전환된다.
   */
  retry: (publicId: string) =>
    apiClient.post<unknown, SubmissionResponse>(`/documents/${publicId}/retry`, {}),

  // TODO: 챗봇 SSE는 chat.ts에 이미 구현됨 (openChatStream)
};
