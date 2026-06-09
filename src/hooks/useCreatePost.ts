import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@/i18n';
import { communityApi, type PostCreateRequest } from '@/api/community';
import { detectPostLanguage } from '@/utils/detectLanguage';

/**
 * 게시글 작성 hook (api-spec — community-service PostController.createPost).
 *
 * <p>성공 시 게시글 목록 ['community','posts']를 invalidate → 목록/카테고리 화면에 새 글 자동 반영.
 * 응답은 생성된 게시글(PostDetailResponse) — 호출 측에서 public_id로 상세 화면 이동에 사용.
 *
 * <p>필수값 누락·잘못된 category(COMMON4001)는 ApiException으로 throw.
 *
 * <p><b>작성 언어 자동 감지(api-spec §2)</b> — body에 language가 없으면 제목+본문 텍스트에서
 * 언어를 감지(franc)해 주입한다. 앱 UI 언어(i18n.language)는 실제 본문 언어와 다를 수 있어
 * (한국어 앱으로 영어 글 작성 등) 본문 자체로 판정한다. 감지 실패 시 i18n.language로 폴백.
 * 호출 측에서 language를 명시하면 그 값을 우선한다(?? 가드). 화이트리스트(ko/en/vi/fil)는
 * 감지 후보 제한 + 백엔드 검증이 함께 보장.
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
    mutationFn: (body: PostCreateRequest) => {
      const detected = detectPostLanguage(`${body.title}\n${body.content}`, i18n.language);
      return communityApi.createPost({ ...body, language: body.language ?? detected });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
    },
  });
};
