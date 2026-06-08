import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isLoggedIn } from '@/auth/tokenStore';
import { memberApi, type LanguageResponse } from '@/api/member';

/**
 * 서버에 저장된 사용자 언어 ↔ i18next 동기화 (이슈 #153).
 *
 * <p>로그인 상태일 때만 `GET /members/me/language`를 호출하고, 그 값을 i18next에 반영해
 * 화면이 자동으로 해당 언어로 전환되게 한다.
 *
 * <p>변경 호출(`updateLanguage` mutation)은 별도 흐름 — `useUpdateLanguage` onSuccess 에서
 * `i18n.changeLanguage()`를 직접 호출한다.
 *
 * <p>토큰이 없으면 query를 비활성화해 401 호출이 발생하지 않게 한다(redirect 루프 방지).
 *
 * <p>인증 필요 영역의 진입점(ProtectedRoute 등)에서 1회 마운트해 사용한다.
 *
 * @example
 *   // ProtectedRoute 안
 *   useLanguageSync();
 */
export function useLanguageSync(): void {
  const { i18n } = useTranslation();
  const enabled = isLoggedIn();
  // ❗ 토큰 없을 때 enabled=false로 query 자체를 막아 401 호출 방지.
  // useMyLanguage 훅을 재사용하지 않는 이유 — 그 훅은 enabled 옵션을 받지 않는 단순 구현이라
  // ProtectedRoute에 그대로 마운트하면 비인증 상태에서도 호출됨.
  const { data } = useQuery<LanguageResponse>({
    queryKey: ['member', 'language'],
    queryFn: () => memberApi.getLanguage(),
    enabled,
  });

  useEffect(() => {
    if (!data?.language) return;
    if (i18n.language === data.language) return;
    void i18n.changeLanguage(data.language);
  }, [data?.language, i18n]);
}
