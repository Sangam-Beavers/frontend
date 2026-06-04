import { apiClient } from './client';

/**
 * member-service API 호출 함수 모음.
 *
 * - 회원가입/로그인/내 정보/탈퇴 등.
 * - 인증 흐름은 팀원이 OIDC PKCE로 작업 예정 — 그 후 본 파일에 함수 추가.
 * - 타입은 5단계(OpenAPI → TS 자동 생성) 후 `@/types/api/member`에서 import.
 */

export const memberApi = {
  // TODO: 팀원 인증 작업 후 추가
  //   getMe, signup, withdraw, sendPasswordResetEmail, resetPassword, updateLanguage 등

  // 일단 비워두고, 인증 도입 시 채운다 — apiClient만 import해두어 구조 자리 잡기.
  _placeholder: () => apiClient.get<unknown, never>('/members/__placeholder__'),
};
