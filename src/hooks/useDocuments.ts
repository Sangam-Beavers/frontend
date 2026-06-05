import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { documentApi, type DocumentListResponse, type DocumentStatusCode } from '@/api/document';

/**
 * 내 문서 분석 요청 목록 조회 hook (GET /documents).
 *
 * <p>본인이 제출한 분석 요청을 최근순(createdAt DESC)으로 페이지 조회한다.
 * 항목의 overall_risk_level은 document_results join 값 — 분석 완료 문서만 채워진다.
 *
 * <p>statuses로 서버 상태 필터(api-spec §4) — Select·History 페이지는 실패 내역을 숨기기 위해
 * ['ANALYZING', 'COMPLETED']를 넘긴다. 생략 시 전체 조회.
 *
 * <p>Select 페이지(최근 분석 내역)와 MyPage 분석 이력 페이지에서 공용.
 * keepPreviousData로 페이지 전환 시 깜빡임 없이 갱신 (useExchangeHistory와 동일 패턴).
 *
 * @param page 0부터 시작하는 페이지 번호
 * @param size 페이지당 건수 (백엔드 기본 20)
 * @param statuses 상태 필터 (생략 시 전체)
 */
export const useDocuments = (page = 0, size = 20, statuses?: DocumentStatusCode[]) =>
  useQuery<DocumentListResponse>({
    queryKey: ['documents', { page, size, statuses }],
    queryFn: () => documentApi.list(page, size, statuses),
    placeholderData: keepPreviousData,
  });
