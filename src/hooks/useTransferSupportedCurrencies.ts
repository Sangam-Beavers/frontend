import { useQuery } from '@tanstack/react-query';
import { walletApi, type TransferSupportedCurrenciesResponse } from '@/api/wallet';

/**
 * 송금 지원 통화 목록 조회 hook (GET /transfers/supported-currencies).
 *
 * <p>송금 화면(앱송금/외화송금/정기송금) 통화 드롭다운용.
 * 마스터성 데이터(현재 KRW/USD/PHP/VND 4종)라 자주 안 바뀌어 staleTime 5분.
 *
 * <p>⚠️ 환전 도메인의 useSupportedCurrencies와 별개 (응답 필드명 code/name/symbol).
 *
 * @example
 *   const { data, isLoading } = useTransferSupportedCurrencies();
 *   const codes = data?.currencies.map(c => c.code) ?? [];
 */
export const useTransferSupportedCurrencies = () =>
  useQuery<TransferSupportedCurrenciesResponse>({
    queryKey: ['wallet', 'transfer-supported-currencies'],
    queryFn: () => walletApi.getTransferSupportedCurrencies(),
    staleTime: 5 * 60_000,
  });
