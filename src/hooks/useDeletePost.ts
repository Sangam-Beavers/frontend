import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/api/community';

/**
 * 게시글 삭제 hook (api-spec — community-service PostController.deletePost).
 *
 * <p>성공 시 목록 ['community','posts']을 invalidate. 호출 측은 onSuccess에서 목록으로 이동한다.
 * 본인 글이 아니면 COMMON4031(403), 없는 글 COMMUNITY4001(404) → ApiException.
 *
 * @example
 *   const del = useDeletePost();
 *   del.mutate(postId, { onSuccess: () => navigate('/community') });
 */
export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communityApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};
