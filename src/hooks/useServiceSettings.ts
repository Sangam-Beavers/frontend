import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client';

export interface ServiceSetting {
  public_id: string;
  setting_key: string;
  setting_value: string;
  active: boolean;
}

/**
 * 공개 서비스 설정 조회 (GET /api/v1/app/settings).
 * 1분 staleTime — 설정은 자주 안 바뀌지만 점검 모드는 빨리 반영돼야 함.
 */
export function useServiceSettings() {
  return useQuery<ServiceSetting[]>({
    queryKey: ['app', 'settings'],
    queryFn: () => apiClient.get<unknown, ServiceSetting[]>('/app/settings'),
    staleTime: 60_000,
    retry: 1,
  });
}

/**
 * 특정 키의 설정값 반환. active=false이거나 없으면 defaultValue.
 */
export function useSetting(key: string, defaultValue = ''): string {
  const { data } = useServiceSettings();
  const found = data?.find((s) => s.setting_key === key && s.active);
  return found?.setting_value ?? defaultValue;
}
