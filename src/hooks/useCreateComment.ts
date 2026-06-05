import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, type CommentCreateRequest } from '@/api/community';

/**
 * 댓글 작성 hook (community-service CommentController.createComment).
 *
 * <p>성공 시 댓글 목록 ['community','comments',postId]와 게시글 상세 ['community','post',postId]를
 * invalidate → 무한 스크롤 목록과 댓글 수(comment_count)가 자동 갱신된다.
 *
 * <p>content 누락·형식 오류(COMMON4001), 없는 글(COMMUNITY4001)은 ApiException으로 throw.
 * 인증 필요(AUTH4011 → 401 시 client 인터셉터가 로그인으로 이동).
 *
 * @example
 *   const create = useCreateComment(postId);
 *   create.mutate({ content }, { onSuccess: () => setDraft('') });
 */
export const useCreateComment = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CommentCreateRequest) => communityApi.createComment(postId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
    },
  });
};
