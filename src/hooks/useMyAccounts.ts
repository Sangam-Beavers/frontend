import { useQuery } from '@tanstack/react-query';
import { walletApi, type AccountListResponse } from '@/api/wallet';

/**
 * 등록된 내 계좌 목록 조회 hook (api-spec — wallet-service AccountController.getMyAccounts).
 *
 * <p>계좌는 자주 바뀌지 않아 기본 staleTime(30초)을 그대로 둔다. 계좌 추가·해제 mutation
 * 연동 시 onSuccess에서 queryKey ['wallet','accounts']를 invalidate하면 자동 갱신된다.
 *
 * <p>등록된 계좌가 없으면 error가 아니라 data.accounts === [] (백엔드가 200 + 빈 배열).
 * 인증 누락(AUTH4011)은 apiClient interceptor가 로그인 화면으로 보낸다.
 *
 * @example
 *   const { data, isLoading, error } = useMyAccounts();
 *   const accounts = data?.accounts ?? [];
 */
export const useMyAccounts = () =>
  useQuery<AccountListResponse>({
    queryKey: ['wallet', 'accounts'],
    queryFn: () => walletApi.getMyAccounts(),
  });
