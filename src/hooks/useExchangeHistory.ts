import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { walletApi, type ExchangeListResponse } from '@/api/wallet';

/**
 * 환전 내역 목록 조회 hook (api-spec §10).
 *
 * <p>본인의 환전·재환전 완료 내역을 최근순으로 페이지 단위 조회한다.
 * keepPreviousData로 페이지 전환 시 화면 깜빡임 없이 부드럽게 갱신.
 *
 * <p>staleTime은 30초(기본). 거래 직후 화면 진입해도 최신 데이터 확보를 위해 너무 길게 두지 않는다.
 *
 * @param page 0부터 시작하는 페이지 번호
 * @param size 페이지당 건수 (백엔드 기본 20, 최대 100)
 */
export const useExchangeHistory = (page = 0, size = 20) =>
  useQuery<ExchangeListResponse>({
    queryKey: ['wallet', 'exchanges', { page, size }],
    queryFn: () => walletApi.getExchanges(page, size),
    placeholderData: keepPreviousData,
  });
