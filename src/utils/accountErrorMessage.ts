import { ApiException } from '@/api';

/**
 * 계좌(추가·인증·등록·예금주조회) 도메인의 백엔드 에러 코드를 사용자용 메시지로 매핑한다.
 *
 * AddAccount(예금주 조회)·AutoDebitAuth(verify/register)가 공용으로 사용한다.
 * 매핑 없는 code는 백엔드 message를 그대로 노출하고, ApiException이 아니면 일반 문구로 폴백한다.
 */
export function accountErrorMessage(err: unknown): string {
  if (err instanceof ApiException) {
    switch (err.code) {
      case 'ACCOUNT4001':
        return '존재하지 않는 계좌예요. 계좌번호를 확인해 주세요.';
      case 'ACCOUNT4002':
        return '계좌 인증에 실패했어요. 은행·계좌번호·예금주를 다시 확인해 주세요.';
      case 'ACCOUNT4003':
        return '연동 계좌의 잔액이 부족해요.';
      case 'ACCOUNT4004':
        return '이미 등록된 계좌예요.';
      case 'ACCOUNT4005':
        return '인증 요청 횟수를 초과했어요. 잠시 후 다시 시도해 주세요.';
      case 'ACCOUNT4006':
        return '인증되지 않은 계좌예요. 계좌를 다시 등록해 주세요.';
      case 'ACCOUNT4007':
        return '충전 한도를 초과했어요.';
      case 'WALLET4001':
        return '전자지갑이 없어요. 잠시 후 다시 시도해 주세요.';
      case 'COMMON4291':
        return '요청 횟수를 초과했어요. 잠시 후 다시 시도해 주세요.';
      case 'COMMON5031':
        return '은행 통신이 일시적으로 불안정해요. 잠시 후 다시 시도해 주세요.';
      case 'COMMON4001':
        return '입력 값이 올바르지 않아요. 다시 확인해 주세요.';
      default:
        return err.message;
    }
  }
  return '처리에 실패했어요. 잠시 후 다시 시도해 주세요.';
}
