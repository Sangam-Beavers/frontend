import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { isLoggedIn } from '@/auth/tokenStore';
import { memberApi, type LanguageResponse } from '@/api/member';

// 토큰 없을 때 enabled=false로 query를 막아 401 호출을 방지한다 — redirect 루프 예방.
export function useLanguageSync(): void {
  const { i18n } = useTranslation();
  const enabled = isLoggedIn();
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
