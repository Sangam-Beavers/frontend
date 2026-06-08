import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletApi, type TransferExecuteRequest, type TransferExecuteResponse } from '@/api/wallet';

export interface ExecuteTransferParams {
  body: TransferExecuteRequest;
  /**
   * 멱등성 키 — TransferConfirm 진입 시 crypto.randomUUID()로 한 번 고정해서
   * 네트워크 재시도/뒤로가기 후 재실행에서도 같은 키를 보낸다. 동일 키 재요청 시 백엔드가
   * 첫 결과를 그대로 재반환(3-layer: Redis → DB UNIQUE → race 재조회).
   */
  idempotencyKey: string;
}

/**
 * 송금 실행 mutation hook (POST /api/v1/transfers — api-spec §6).
 *
 * <p>호출 전제: 사용자가 같은 화면에서 직전에 PIN 검증(`useVerifyTransferPin`)을 성공시켜
 * 서버에 단명·단일사용 마커가 있어야 한다. 마커는 GETDEL로 본 API가 소비한다(TX-PIN).
 *
 * <p>성공 시 잔액·거래내역·송금 관련 캐시를 invalidate해 송금 후 화면들이 최신 상태가 되도록 한다:
 * - `['wallet','balances']` (잔액)
 * - `['wallet','transactions']` (거래내역)
 * - `['wallet','recent-recipients']` (INTERNAL — 최근 송금 앱 사용자)
 * - `['wallet','recent-remittance-accounts']` (REMITTANCE — 최근 송금 외부 계좌, CodeRabbit 반영)
 * - `['wallet','wallet-me']` (홈 원화 환산)
 *
 * <p>에러는 ApiException으로 throw — 호출 측 onError에서 코드별 분기.
 * 자주 마주칠 코드: WALLET4002(잔액 부족), TRANSFER4010(PIN 마커 없음), TRANSFER4008(PIN 잠금),
 * COMMON5031(락 경합).
 */
export const useExecuteTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation<TransferExecuteResponse, Error, ExecuteTransferParams>({
    mutationFn: ({ body, idempotencyKey }) => walletApi.executeTransfer(body, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet', 'balances'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'recent-recipients'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'recent-remittance-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['wallet', 'wallet-me'] });
    },
  });
};
