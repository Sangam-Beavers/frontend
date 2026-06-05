import { useInfiniteQuery } from '@tanstack/react-query';
import { communityApi, type CommentListResponse } from '@/api/community';

/** 댓글 한 페이지 크기. */
const COMMENT_PAGE_SIZE = 20;

/**
 * 게시글 댓글 무한 스크롤 조회 hook (community-service CommentController.getComments).
 *
 * <p>게시글 상세 화면에서 사용. page/size로 페이징되며, 스크롤이 바닥에 닿으면
 * fetchNextPage로 다음 페이지를 이어 붙인다. postId가 비어있으면 호출하지 않는다.
 *
 * <p>각 페이지 응답에 page/total_pages가 있어 getNextPageParam에서 다음 페이지 유무를 판단한다.
 * 댓글 작성/삭제 mutation 연동 시 ['community','comments',postId] invalidate로 갱신.
 *
 * @example
 *   const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useComments(postId);
 *   const comments = data?.pages.flatMap((p) => p.comments) ?? [];
 */
export const useComments = (postId: string) =>
  useInfiniteQuery<CommentListResponse>({
    queryKey: ['community', 'comments', postId],
    queryFn: ({ pageParam }) =>
      communityApi.getComments(postId, { page: pageParam as number, size: COMMENT_PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage < lastPage.total_pages ? nextPage : undefined;
    },
    enabled: postId !== '',
  });
