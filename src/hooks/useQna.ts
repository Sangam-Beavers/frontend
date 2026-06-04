import { useQuery } from '@tanstack/react-query';
import { communityApi, type QnaListResponse } from '@/api/community';

/**
 * 주요 QnA 목록 조회 hook (api-spec §8).
 *
 * <p>레퍼런스 hook — 다른 도메인 hook 작성 시 본 구조를 그대로 복사해 시작하면 된다.
 * 인증 불필요(공개 API)라 어디서든 호출 가능.
 *
 * @example
 *   const { data, isLoading, error } = useQna({ category: 'JOB', size: 1 });
 */
export const useQna = (params?: { category?: string; size?: number }) =>
  useQuery<QnaListResponse>({
    // queryKey 패턴: [도메인, 리소스, 파라미터]. params를 포함해야 파라미터 변경 시 자동 재요청.
    queryKey: ['community', 'qna', params],
    queryFn: () => communityApi.getQna(params),
    // staleTime은 main.tsx 기본값(30s) 사용. 더 자주/덜 자주 갱신해야 하면 override.
    // 예: staleTime: 0 (잔액 같이 항상 최신 필요한 데이터)
  });
