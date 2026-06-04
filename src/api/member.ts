import { apiClient } from './client';

/**
 * member-service API 호출 함수 모음.
 *
 * - 회원가입/로그인/내 정보/탈퇴 + 비밀번호 재설정 등.
 * - 타입은 5단계(OpenAPI → TS 자동 생성) 후 `@/types/api/member`에서 import.
 *
 * 인증 토큰은 `apiClient` request interceptor가 sessionStorage에서 자동 부착(가이드 §2).
 * 인증 전 호출(비밀번호 재설정 등)은 토큰 없이 호출돼도 문제 없음.
 */

// ---------- Request 타입 (인라인, 백엔드 명세 기준 snake_case) ----------

export interface RequestPasswordResetBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  /** 백엔드 전역 SNAKE_CASE 규칙 — 필드명 그대로 사용. */
  new_password: string;
}

// ---------- API 함수 ----------

export const memberApi = {
  /**
   * 비밀번호 재설정 메일 요청 (가입 이메일로 토큰 링크 발송).
   *
   * <p>응답은 가입 여부와 무관하게 항상 200 (보안: 가입 여부 비노출).
   * 형식 오류는 400 COMMON4001 → ApiException으로 throw됨.
   */
  requestPasswordReset: (body: RequestPasswordResetBody) =>
    apiClient.post<unknown, void>('/auth/password/reset-request', body),

  /**
   * 비밀번호 재설정 실행 (메일 링크의 token + 새 비밀번호).
   *
   * <p>토큰 만료/위조/재사용은 404 MEMBER4004 → ApiException(code: 'MEMBER4004') throw.
   * 성공 시 백엔드가 IdP(Authentik)에 비밀번호 갱신을 위임한다(방식 B).
   */
  resetPassword: (body: ResetPasswordBody) =>
    apiClient.post<unknown, void>('/auth/password/reset', body),

  // TODO: 다음 사이클
  //   getMe, signup, withdraw, updateLanguage 등
};
