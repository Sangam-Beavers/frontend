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

// ---------- Request/Response 타입 (인라인, 백엔드 명세 기준 snake_case) ----------

export interface SignupBody {
  email: string;
  password: string;
  name: string;
  nickname: string;
  nationality: string;
  language: string;
}

/** 가입 성공(201) 응답 data. 내부 id(BIGINT)는 노출되지 않는다(public_id만). */
export interface SignupResult {
  public_id: string;
  email: string;
  nickname: string;
}

/** 이메일/닉네임 중복확인 응답 data. true=사용 가능, false=이미 사용 중. */
export interface CheckAvailabilityResult {
  available: boolean;
}

export interface RequestPasswordResetBody {
  email: string;
}

export interface ResetPasswordBody {
  token: string;
  /** 백엔드 전역 SNAKE_CASE 규칙 — 필드명 그대로 사용. */
  new_password: string;
}

/**
 * GET /api/v1/members/me 응답 (docs/auth/api-spec.md §8 + ProfileResponse DTO).
 *
 * 자동 생성 타입(@/types/api/member)이 camelCase로 떨어져 실제 응답과 안 맞아
 * 인라인으로 snake_case 명시 (README §2 참고).
 */
export interface ProfileResponse {
  public_id: string;
  email: string;
  nickname: string;
  /** ISO 3166-1 alpha-2 (예: "VN"). */
  nationality: string;
  /** BCP 47 (예: "ko", "vi"). */
  language: string;
  /** 자기소개. 미입력 시 null. */
  bio: string | null;
  /** 신분증 인증 배지 여부. user_verifications APPROVED 시 true. */
  is_verified: boolean;
  /** 매너온도 등급 RED/YELLOW/GREEN/PURPLE/BLUE. 현재 "GREEN" 고정(커뮤니티 도메인 미구현). */
  temperature_grade: string;
  /** 프로필 사진 URL. 이미지 도메인 미구현으로 현재 항상 null. */
  profile_image_url: string | null;
  /** 가입 일시 (ISO 8601 UTC Z). */
  created_at: string;
}

// ---------- API 함수 ----------

export const memberApi = {
  /**
   * 회원가입 (201) — 백엔드가 IdP(Authentik) 사용자 생성 + public_id 발급까지 처리(방식 B).
   *
   * <p>이메일 중복 409 MEMBER4002 / 닉네임 중복 409 MEMBER4003 / 형식 오류 400 COMMON4001
   * → ApiException으로 throw.
   */
  signup: (body: SignupBody) => apiClient.post<unknown, SignupResult>('/auth/register', body),

  /** 이메일 사용 가능 여부 사전 확인 (최종 검증은 가입 시 서버가 다시 수행). */
  checkEmail: (email: string) =>
    apiClient.get<unknown, CheckAvailabilityResult>('/members/check-email', {
      params: { email },
    }),

  /** 닉네임 사용 가능 여부 사전 확인 (최종 검증은 가입 시 서버가 다시 수행). */
  checkNickname: (nickname: string) =>
    apiClient.get<unknown, CheckAvailabilityResult>('/members/check-nickname', {
      params: { nickname },
    }),

  /**
   * 내 프로필 조회 — 마이페이지 표시용 (api-spec §8).
   *
   * <p>인증 필요. JWT public_id claim으로 본인 식별.
   * 에러: 401 AUTH4011 / 404 MEMBER4001.
   */
  getMyProfile: () => apiClient.get<unknown, ProfileResponse>('/members/me'),

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

  // TODO: 다음 사이클 — withdraw, updateLanguage 등
};
