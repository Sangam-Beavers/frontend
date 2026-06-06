import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi, type PostLikeResponse } from '@/api/community';

/**
 * 관심글(좋아요) 저장·취소 토글 hook (community-service PostLikeController).
 *
 * <p>mutate 인자는 "원하는 다음 상태(next)" — true면 저장(POST), false면 취소(DELETE).
 * 응답으로 갱신된 like_count·liked가 와서 호출 측이 즉시 화면에 반영한다.
 *
 * <p>성공 시 게시글 상세 ['community','post',postId]와 목록 ['community','posts']를 invalidate.
 * 목록 키 prefix가 관심글 목록(['community','posts','liked',…])까지 포함하므로 한 번에 갱신된다.
 *
 * <p>이미 좋아요한 글 저장은 COMMON4091(409) → 호출 측에서 "이미 좋아요" 상태로 보정.
 * 인증 필요(AUTH4011 → 401 시 client 인터셉터가 로그인으로 이동).
 *
 * @example
 *   const toggleLike = useToggleLike(postId);
 *   toggleLike.mutate(!liked, { onSuccess: (res) => setLikeState(res) });
 */
export const useToggleLike = (postId: string) => {
  const queryClient = useQueryClient();
  return useMutation<PostLikeResponse, unknown, boolean>({
    mutationFn: (next: boolean) =>
      next ? communityApi.likePost(postId) : communityApi.unlikePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'post', postId] });
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};
