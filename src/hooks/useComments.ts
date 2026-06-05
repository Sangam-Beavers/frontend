import { useQuery } from '@tanstack/react-query';
import { communityApi, type CommentListResponse } from '@/api/community';

/**
 * 게시글 댓글 목록 조회 hook (api-spec — community-service CommentController.getComments).
 *
 * <p>게시글 상세 화면에서 사용. postId가 비어있으면 호출하지 않는다(enabled).
 * 댓글 작성/삭제 mutation 연동 시 ['community','comments',postId] invalidate로 갱신.
 *
 * @example
 *   const { data } = useComments(postId);
 *   const comments = data?.comments ?? [];
 */
export const useComments = (postId: string) =>
  useQuery<CommentListResponse>({
    queryKey: ['community', 'comments', postId],
    queryFn: () => communityApi.getComments(postId),
    enabled: postId !== '',
  });
