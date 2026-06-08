import { useQuery } from '@tanstack/react-query';
import { communityApi, type CommentTranslationResponse } from '@/api/community';

/**
 * 댓글 동적 번역 조회 hook (이슈 #160 / 백엔드 #161).
 *
 * <p>{@link usePostTranslation}과 동일한 lazy 패턴 — 댓글의 "번역 보기" 클릭 시점에만 호출.
 * 캐시 키 `['community','comment',commentId,'translation',language]`. staleTime 무한.
 *
 * <p>postId/commentId/language 중 하나라도 비어있거나 `enabled=false`면 호출하지 않는다.
 *
 * @example
 *   const [showTranslated, setShowTranslated] = useState(false);
 *   const { data, isFetching, error } = useCommentTranslation(
 *     postId,
 *     comment.public_id,
 *     i18n.language,
 *     showTranslated,
 *   );
 */
export const useCommentTranslation = (
  postId: string,
  commentId: string,
  language: string,
  enabled: boolean
) =>
  useQuery<CommentTranslationResponse>({
    queryKey: ['community', 'comment', commentId, 'translation', language],
    queryFn: () => communityApi.getCommentTranslation(postId, commentId, language),
    enabled: enabled && postId !== '' && commentId !== '' && language !== '',
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    retry: false,
  });
