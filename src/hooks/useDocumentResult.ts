import { useQuery } from '@tanstack/react-query';
import { ApiException, documentApi, type DocumentResultResponse } from '@/api';

/**
 * 분석 결과 상세 조회 hook (GET /api/v1/documents/{publicId}/result).
 *
 * <p>이미 분석이 끝나 DB에 결과가 들어있는 문서를 가져온다. 분석 요청/폴링 흐름과는
 * 분리된 호출이라, publicId만 알면 어디서든 호출 가능.
 *
 * <p>백엔드가 분석 미완료 상태(`ANALYZING` / 결과 미생성)일 땐 422(`COMMON4221`)로 응답하고
 * client interceptor가 ApiException으로 throw → React Query의 `error`로 들어온다.
 * 호출 측은 `error.code === 'COMMON4221'`로 분기해 "분석 진행 중" UI를 보여줄 수 있다.
 *
 * @param publicId 분석 문서 식별자. null/undefined면 쿼리 비활성(`enabled: false`).
 * @example
 *   const { data, isLoading, error } = useDocumentResult(publicId);
 *   if (error instanceof ApiException && error.code === 'COMMON4221') ...
 */
export const useDocumentResult = (publicId: string | null | undefined) =>
  useQuery<DocumentResultResponse, ApiException>({
    queryKey: ['document', 'result', publicId],
    queryFn: () => {
      if (!publicId) {
        throw new Error('publicId is required'); // enabled 가드로 도달 불가
      }
      return documentApi.getResult(publicId);
    },
    enabled: !!publicId,
    // 분석 완료된 결과는 변경 빈도가 매우 낮음 — 캐시 길게(5분).
    staleTime: 5 * 60 * 1000,
    // 422(분석중)인 경우 자동 재시도는 의미 없음. 그 외 네트워크 오류도 1회로 제한.
    retry: 1,
  });
