import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { walletApi, type TransactionListResponse } from '@/api/wallet';

/**
 * 전자지갑 거래내역 조회 hook (api-spec §3).
 *
 * <p>본인이 송신자 또는 수신자인 전 유형(CHARGE/INTERNAL_TRANSFER/REMITTANCE/EXCHANGE)
 * 거래를 최근순으로 페이지 단위 조회한다. 각 항목의 direction(OUT/IN)으로 본인 시점
 * 출금/입금을 판단한다(useExchangeHistory와 동일 컨벤션).
 *
 * <p>keepPreviousData로 페이지 전환 시 화면 깜빡임 없이 부드럽게 갱신. staleTime은 기본값(0)
 * — 거래는 자주 일어나는 도메인이라 캐싱을 짧게 두고 진입 시마다 새로 가져온다.
 *
 * @param page 0부터 시작하는 페이지 번호
 * @param size 페이지당 건수 (백엔드 기본 20, 최대 100)
 *
 * @example
 *   const { data, isLoading, error } = useTransactions(0, 20);
 *   data?.transactions  // TransactionHistoryItem[]
 */
export const useTransactions = (page = 0, size = 20) =>
  useQuery<TransactionListResponse>({
    queryKey: ['wallet', 'transactions', { page, size }],
    queryFn: () => walletApi.getTransactions(page, size),
    placeholderData: keepPreviousData,
  });
