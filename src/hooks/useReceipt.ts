import { useQuery } from '@tanstack/react-query';
import { walletApi, type TransferReceiptResponse } from '@/api/wallet';

/**
 * 송금 확인증 단건 조회 hook (api-spec §7-1 — GET /api/v1/transfers/{id}/receipt).
 *
 * <p>완료된 INTERNAL_TRANSFER / REMITTANCE 한 건의 확인증을 본인 시점에서 조회한다.
 * publicId가 빈 값이면 호출하지 않는다(enabled false) — URL 직접 접근 시 path가 비어서 들어오면
 * 의미 없는 호출 방지.
 *
 * <p>staleTime 5분 — 확인증 내용은 한 번 확정되면 거의 안 바뀐다(수수료/환율/시각 등이 완료 시점 스냅샷).
 *
 * @example
 *   const { transferPublicId = '' } = useParams();
 *   const { data, isLoading, error } = useReceipt(transferPublicId);
 */
export const useReceipt = (transferPublicId: string) =>
  useQuery<TransferReceiptResponse>({
    queryKey: ['wallet', 'receipt', transferPublicId],
    queryFn: () => walletApi.getReceipt(transferPublicId),
    enabled: Boolean(transferPublicId),
    staleTime: 5 * 60_000,
  });
