import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, type PostCreateRequest } from '@/api/community';

/**
 * 게시글 작성 hook (api-spec — community-service PostController.createPost).
 *
 * <p>성공 시 게시글 목록 ['community','posts']를 invalidate → 목록/카테고리 화면에 새 글 자동 반영.
 * 응답은 생성된 게시글(PostDetailResponse) — 호출 측에서 public_id로 상세 화면 이동에 사용.
 *
 * <p>필수값 누락·잘못된 category(COMMON4001)는 ApiException으로 throw.
 *
 * @example
 *   const create = useCreatePost();
 *   create.mutate(
 *     { category: 'JOB', title, content },
 *     { onSuccess: (post) => navigate(buildCommunityPostPath(post.public_id)) }
 *   );
 */
export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PostCreateRequest) => communityApi.createPost(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};
