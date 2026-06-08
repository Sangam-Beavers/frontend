import { useQuery } from '@tanstack/react-query';
import { communityApi, type PostTranslationResponse } from '@/api/community';

/**
 * 게시글 동적 번역 조회 hook (이슈 #160 / 백엔드 #161).
 *
 * <p>"번역 보기" 버튼 클릭 시점에만 호출되도록 `enabled` 토글 패턴을 쓴다.
 * 캐시 키 `['community','post',postId,'translation',language]` — 같은 (post, language) 조합은
 * 두 번째 클릭에 즉시 캐시 반환된다. staleTime 무한 — 게시글이 수정되지 않는 한 같은 번역.
 *
 * <p>useQuery + enabled 패턴을 쓰는 이유:
 * <ul>
 *   <li>같은 글을 "번역 ↔ 원문" 토글할 때 두 번째 "번역 보기"는 네트워크 없이 즉시 표시.</li>
 *   <li>useMutation은 캐시가 없어 매 클릭마다 호출 → 비용·딜레이 발생.</li>
 * </ul>
 *
 * <p>postId 또는 language가 비어있거나 `enabled=false`면 호출하지 않는다.
 *
 * @example
 *   const [showTranslated, setShowTranslated] = useState(false);
 *   const { data, isFetching, error } = usePostTranslation(postId, i18n.language, showTranslated);
 *   // 버튼 onClick에서 setShowTranslated(true) — enabled=true 되며 호출.
 */
export const usePostTranslation = (postId: string, language: string, enabled: boolean) =>
  useQuery<PostTranslationResponse>({
    queryKey: ['community', 'post', postId, 'translation', language],
    queryFn: () => communityApi.getPostTranslation(postId, language),
    enabled: enabled && postId !== '' && language !== '',
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000, // 30분 동안 캐시 유지
    retry: false, // 4xx(지원언어/길이초과)는 재시도 무의미
  });
