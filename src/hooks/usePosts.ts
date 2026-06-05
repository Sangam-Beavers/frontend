import { useQuery } from '@tanstack/react-query';
import { communityApi, type PostListParams, type PostListResponse } from '@/api/community';

/**
 * 게시글 목록·검색 hook (api-spec — community-service PostController.getPosts).
 *
 * <p>category·keyword·sort·page·size 파라미터로 조회. params를 queryKey에 포함해
 * 검색어/카테고리/페이지가 바뀌면 자동 재요청된다. 공개 API라 인증 불필요.
 *
 * <p>검색 입력은 호출 측에서 디바운스해 keyword로 넘긴다(매 타이핑마다 요청 방지).
 *
 * @example
 *   const { data, isLoading, error } = usePosts({ category: 'JOB', keyword: '면접' });
 *   const posts = data?.posts ?? [];
 */
export const usePosts = (params?: PostListParams) =>
  useQuery<PostListResponse>({
    queryKey: ['community', 'posts', params],
    queryFn: () => communityApi.getPosts(params),
  });
