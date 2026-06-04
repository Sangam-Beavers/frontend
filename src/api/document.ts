import { apiClient } from './client';

/**
 * document-service API 호출 함수 모음 (문서 업로드·분석·챗봇 SSE).
 *
 * - 현재 document-service는 헤더 임시 인증(`X-User-Public-Id`) 사용 (CLAUDE.md §9).
 * - 향후 OAuth2 Resource Server 전환 시 자동으로 Bearer 토큰 부착(별도 작업 불필요).
 * - 타입은 5단계(OpenAPI → TS 자동 생성) 후 `@/types/api/document`에서 import.
 */

export const documentApi = {
  // TODO: 다음 사이클에서 추가
  //   업로드: getUploadUrl, submitAnalysis
  //   결과: getAnalysisResult, getMyAnalyses
  //   챗봇 SSE: openChatStream (fetch + ReadableStream 또는 EventSource)

  _placeholder: () => apiClient.get<unknown, never>('/documents/__placeholder__'),
};
