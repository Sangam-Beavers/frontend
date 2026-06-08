import { useMutation } from '@tanstack/react-query';
import { walletApi, type TransferPinBody } from '@/api/wallet';

/**
 * 송금 PIN 검증 mutation hook (POST /api/v1/transfers/pin-verify — api-spec §5).
 *
 * <p>송금/정기송금 설정 직전 본인확인. 성공 시 서버에 단명·단일사용 마커
 * (`pin:verified:{userPublicId}`, TTL 180초) 발급. 송금 실행/정기송금 등록이 GETDEL로
 * 원자 소비한다(TX-PIN). 1회 검증 = 1회 인가 — 송금 직전 다시 검증해야 한다.
 *
 * <p>주요 에러 (모두 ApiException으로 throw — 호출 측 onError에서 코드별 분기):
 * - 400 TRANSFER4007 — PIN 불일치 (메시지에 남은 횟수)
 * - 400 TRANSFER4009 — PIN 미설정 (먼저 setTransferPin)
 * - 429 TRANSFER4008 — 5회 연속 실패 시 10분 잠금
 * - 429 COMMON4291 — 사용자 단위 rate-limit (기본 60초 / 5회)
 *
 * @example
 *   const verifyPin = useVerifyTransferPin();
 *   verifyPin.mutate({ pin }, {
 *     onSuccess: () => executeTransfer.mutate({ body, idempotencyKey }),
 *     onError: (e) => showPinError(e),
 *   });
 */
export const useVerifyTransferPin = () =>
  useMutation<void, Error, TransferPinBody>({
    mutationFn: (body) => walletApi.verifyTransferPin(body),
  });
