import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/api/community';

/**
 * 댓글 삭제 hook (community-service CommentController.deleteComment).
 *
 * <p>성공 시 댓글 목록 ['community','comments',postId]와 게시글 상세 ['community','post',postId]를
 * invalidate → 무한 스크롤 목록과 댓글 수(comment_count)가 자동 갱신된다.
 *
 * <p>본인 댓글이 아니면 COMMON4031(403), 없는 댓글(COMMUNITY4001)은 ApiException으로 throw.
 *
 * @example
 *   const del = useDeleteComment(postId);
 *   del.mutate(commentId);
 */
export const useDeleteComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => communityApi.deleteComment(postId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
    },
  });
};
