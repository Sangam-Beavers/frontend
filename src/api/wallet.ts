import { apiClient } from './client';

/**
 * wallet-service API 호출 함수 모음 (잔액·계좌·충전·송금·정기송금).
 *
 * - 모두 인증 필요(JWT) — 팀원 인증 작업 후 본격 사용.
 * - 타입은 5단계(OpenAPI → TS 자동 생성) 후 `@/types/api/wallet`에서 import.
 */

export const walletApi = {
  // TODO: 다음 사이클에서 추가
  //   잔액: getBalance
  //   계좌: registerAccount, deleteAccount, getMyAccounts
  //   충전: charge
  //   송금: validateMember, validateBank, execute, getReceipt, getRecentRecipients
  //   정기송금: validateScheduled, createScheduled, listScheduled, getHistory

  _placeholder: () => apiClient.get<unknown, never>('/wallets/__placeholder__'),
};
