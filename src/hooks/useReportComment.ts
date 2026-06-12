import { useMutation } from '@tanstack/react-query';
import { communityApi } from '@/api/community';
import type { ReportRequest } from '@/api/community';

/**
 * 댓글 신고 mutation 훅.
 *
 * <p>성공: 201 ReportResponse. 에러 코드 처리는 호출 측(onError)에서 담당한다.
 * COMMUNITY4006 = 중복 신고, COMMUNITY4007 = 잘못된 사유.
 */
export function useReportComment(postId: string, commentId: string) {
  return useMutation({
    mutationFn: (body: ReportRequest) => communityApi.reportComment(postId, commentId, body),
  });
}
