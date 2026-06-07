import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { memberApi, type LanguageResponse } from '@/api/member';

/**
 * 내 주 사용 언어 조회 hook (api-spec — member-service MemberMeController.getLanguage).
 *
 * <p>마이페이지 언어 설정 화면 초기값으로 사용. 캐시 키 `['member','language']`.
 * 인증 누락(AUTH4011)은 apiClient interceptor가 로그인으로 redirect.
 *
 * @example
 *   const { data, isLoading } = useMyLanguage();
 *   const currentCode = data?.language ?? 'ko';
 */
export const useMyLanguage = () =>
  useQuery<LanguageResponse>({
    queryKey: ['member', 'language'],
    queryFn: () => memberApi.getLanguage(),
  });

/**
 * 내 주 사용 언어 변경 hook (api-spec — member-service MemberMeController.updateLanguage).
 *
 * <p>성공 시 `['member','language']` + `['member','me']`를 invalidate해서
 * AllMenu·ProfileEdit 등 다른 화면에서도 즉시 갱신되게 한다.
 * 400 COMMON4001(빈 언어) / 401 AUTH4011 / 404 MEMBER4001 → ApiException.
 *
 * @example
 *   const update = useUpdateLanguage();
 *   update.mutate('vi', {
 *     onSuccess: () => toast('언어가 변경되었습니다.'),
 *     onError: () => toast('변경에 실패했어요.', 'error'),
 *   });
 */
export const useUpdateLanguage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (language: string) => memberApi.updateLanguage(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', 'language'] });
      queryClient.invalidateQueries({ queryKey: ['member', 'me'] });
    },
  });
};
