import { useQuery } from '@tanstack/react-query';
import { walletApi, type TransferFeeRequest, type TransferFeeResponse } from '@/api/wallet';

/**
 * 송금 수수료 계산 — TransferConfirm 화면 진입 시 즉시 호출.
 *
 * POST /api/v1/transfers/fee
 *
 * - 입력(transfer_type/currency_code/amount) 변경 시 자동 재계산.
 * - staleTime 0: 수수료 정책이 변할 가능성에 대비해 항상 최신값.
 * - enabled로 amount > 0 일 때만 호출 — 빈/0 값 차단해 COMMON4001 회피.
 */
export const useTransferFee = (body: TransferFeeRequest | null) =>
  useQuery<TransferFeeResponse>({
    queryKey: ['wallet', 'transfer-fee', body],
    queryFn: () => walletApi.getTransferFee(body!),
    enabled: !!body && Number(body.amount) > 0,
    staleTime: 0,
  });
