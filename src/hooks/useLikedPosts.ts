import { useQuery } from '@tanstack/react-query';
import {
  communityApi,
  type LikedPostListParams,
  type LikedPostListResponse,
} from '@/api/community';

/**
 * 관심글(좋아요한 게시글) 목록 hook (community-service PostController.getLikedPosts).
 *
 * <p>sort·page·size로 조회. params를 queryKey에 포함해 페이지/정렬이 바뀌면 자동 재요청된다.
 * queryKey가 ['community','posts',…] prefix 하위라, 좋아요 토글 시 invalidate(['community','posts'])로
 * 함께 갱신된다(useToggleLike 참고).
 *
 * <p>인증 필요(AUTH4011 → 401 시 client 인터셉터가 로그인으로 이동).
 *
 * @example
 *   const { data, isLoading, error } = useLikedPosts({ page });
 *   const posts = data?.posts ?? [];
 */
export const useLikedPosts = (params?: LikedPostListParams) =>
  useQuery<LikedPostListResponse>({
    queryKey: ['community', 'posts', 'liked', params],
    queryFn: () => communityApi.getLikedPosts(params),
  });
