import { useQuery } from '@tanstack/react-query';
import { communityApi, type PostDetailResponse } from '@/api/community';

/**
 * 게시글 단건 조회 hook (api-spec — community-service PostController.getPostDetail).
 *
 * <p>postId가 비어있으면(라우트 진입 전 등) 호출하지 않는다(enabled).
 * 없는 게시글(COMMUNITY4001)은 error 상태 → 화면에서 "삭제/잘못된 주소" 안내.
 *
 * @example
 *   const { data, isLoading, error } = usePostDetail(postId);
 */
export const usePostDetail = (postId: string) =>
  useQuery<PostDetailResponse>({
    queryKey: ['community', 'post', postId],
    queryFn: () => communityApi.getPostDetail(postId),
    enabled: postId !== '',
  });
