import { useMutation } from '@tanstack/react-query';
import { walletApi, type TransferPinBody } from '@/api/wallet';

/**
 * 송금 PIN 최초 등록 mutation hook (POST /api/v1/transfers/pin — api-spec §5).
 *
 * <p>PIN은 숫자 6자리 문자열. 방식 B(IdP가 계정 비밀번호 보유)라 송금 본인확인은 별도 PIN 6자리.
 *
 * <p>이미 설정된 사용자가 재호출 시 COMMON4091(409) → ApiException으로 throw. 변경(기존 확인 후 교체)
 * API는 백엔드 후속 과제라 본 hook은 등록 1회만 다룬다.
 *
 * <p>에러: COMMON4001(400, 형식) / COMMON4091(409, 이미 설정) / WALLET4003(422, 비활성 지갑).
 *
 * @example
 *   const setPin = useSetTransferPin();
 *   setPin.mutate({ pin: '123456' }, { onSuccess: () => navigate(...) });
 */
export const useSetTransferPin = () =>
  useMutation<void, Error, TransferPinBody>({
    mutationFn: (body) => walletApi.setTransferPin(body),
  });
