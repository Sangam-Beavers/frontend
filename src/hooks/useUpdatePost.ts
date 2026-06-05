import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, type PostUpdateRequest } from '@/api/community';

export interface UpdatePostParams {
  postId: string;
  body: PostUpdateRequest;
}

/**
 * 게시글 수정 hook (api-spec — community-service PostController.updatePost).
 *
 * <p>성공 시 목록 ['community','posts']과 해당 글 상세 ['community','post',postId]를 invalidate.
 * 본인 글이 아니면 COMMON4031(403) → ApiException으로 throw.
 *
 * @example
 *   const update = useUpdatePost();
 *   update.mutate({ postId, body: { title, content, category } });
 */
export const useUpdatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, body }: UpdatePostParams) => communityApi.updatePost(postId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      queryClient.invalidateQueries({ queryKey: ['community', 'post', variables.postId] });
    },
  });
};
