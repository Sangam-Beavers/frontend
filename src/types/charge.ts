export interface AuthStep {
  index: number;
  label: string;
  done: boolean;
}

/**
 * 계좌 등록 흐름에서 화면 간 전달하는 입력값
 * (AddAccount → AutoDebitAuth → AccountRegistered, react-router location.state로 전달).
 *
 * 백엔드 등록(POST /accounts)은 아직 미연동 — 이 값은 "사용자가 입력/확인한 값"이지
 * 서버가 확정한 계좌가 아니다. POST 연동 시 응답값으로 대체할 것.
 */
export interface AccountRegisterDraft {
  bankName: string;
  accountNumber: string;
  holderName: string;
}
