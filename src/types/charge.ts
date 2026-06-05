export interface AuthStep {
  index: number;
  label: string;
  done: boolean;
}

/**
 * 계좌 등록 흐름에서 입력값을 전달 (AddAccount → AutoDebitAuth, react-router location.state).
 *
 * AutoDebitAuth에서 verify/register 요청 body로 쓰이므로 bank_code도 함께 들고 다닌다
 * (bankName은 화면 표시용).
 */
export interface AccountRegisterDraft {
  bankCode: string;
  bankName: string;
  /** 하이픈 없는 계좌번호 raw. */
  accountNumber: string;
  holderName: string;
}

/**
 * 등록 완료 화면에 표시할 "서버가 확정한" 계좌 정보
 * (AutoDebitAuth의 register 성공 응답 → AccountRegistered, location.state로 전달).
 *
 * accountNumberMasked는 백엔드가 마스킹해 내려준 값(앞 3 + 끝 2)을 그대로 쓴다.
 */
export interface RegisteredAccountView {
  bankName: string;
  accountNumberMasked: string;
  holderName: string;
}
