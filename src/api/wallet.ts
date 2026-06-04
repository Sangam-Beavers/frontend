import { apiClient } from './client';

/**
 * wallet-service API 호출 함수 모음 (잔액·계좌·충전·송금·정기송금).
 *
 * - 모두 인증 필요(JWT) — interceptor가 토큰 자동 부착.
 * - 타입은 5단계(OpenAPI → TS 자동 생성) 후 `@/types/api/wallet`에서 import.
 */

// ---------- Request 타입 (인라인, 백엔드 명세 기준) ----------

export interface TransferPinBody {
  /** 송금 PIN — 숫자 6자리 문자열(예: "123456"). 필드명은 password 아님(별도 PIN 재설계 — 백엔드 #127). */
  pin: string;
}

// ---------- API 함수 ----------

export const walletApi = {
  /**
   * 송금 PIN 최초 등록 (201).
   *
   * <p>이미 등록돼 있으면 409 COMMON4091 → ApiException(code 'COMMON4091').
   * PIN 변경(기존 확인 후 교체) API는 백엔드 후속 과제.
   */
  setTransferPin: (body: TransferPinBody) => apiClient.post<unknown, void>('/transfers/pin', body),

  /**
   * 송금 PIN 검증 (200) — 송금 직전 이중 인증.
   *
   * <p>불일치 TRANSFER4007(400, 메시지에 남은 횟수) / 5회 초과 잠금 TRANSFER4008(429, 10분)
   * / 미설정 TRANSFER4009(400 → 설정 화면으로 유도). 모두 ApiException으로 throw.
   */
  verifyTransferPin: (body: TransferPinBody) =>
    apiClient.post<unknown, void>('/transfers/pin-verify', body),

  // TODO: 다음 사이클에서 추가
  //   잔액: getBalance
  //   계좌: registerAccount, deleteAccount, getMyAccounts
  //   충전: charge
  //   송금: validateMember, validateBank, execute, getReceipt, getRecentRecipients
  //   정기송금: validateScheduled, createScheduled, listScheduled, getHistory
};
