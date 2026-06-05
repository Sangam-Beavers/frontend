import { useQuery } from '@tanstack/react-query';
import { walletApi, type SupportedBankListResponse } from '@/api/wallet';

/**
 * 추가 지원 은행 목록 조회 hook (api-spec — wallet-service AccountController.getSupportedBanks).
 *
 * <p>은행 목록은 자주 바뀌지 않는 마스터 데이터라 staleTime을 5분으로 둔다(api/README.md §2 가이드).
 * 계좌 등록 화면의 은행 드롭다운에서 사용 — value는 bank_code, 표시는 bank_name.
 *
 * @example
 *   const { data, isLoading, error } = useSupportedBanks();
 *   const banks = data?.banks ?? [];
 */
export const useSupportedBanks = () =>
  useQuery<SupportedBankListResponse>({
    queryKey: ['wallet', 'supported-banks'],
    queryFn: () => walletApi.getSupportedBanks(),
    staleTime: 5 * 60_000,
  });
