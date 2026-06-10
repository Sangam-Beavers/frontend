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

// ---------- 신분증 인증 (이슈 #108 / 백엔드 #152) ----------

/**
 * 신분증 유형. 백엔드 {@code IdentityDocumentType} enum SSOT.
 *
 * <p>이슈 #108 — 여권/일반 NATIONAL_ID 제거. 한국 거주 외국인(외국인등록증) + 본국 거주 4개국
 * (한국/미국/베트남/필리핀) 5개로 사용자 분류를 끝냈다.
 */
export type IdentityDocumentTypeCode =
  | 'ALIEN_REGISTRATION'
  | 'NATIONAL_ID_KR'
  | 'NATIONAL_ID_US'
  | 'NATIONAL_ID_VN'
  | 'NATIONAL_ID_PH';

/** 인증 상태. 백엔드 VerificationStatus enum. 형식 검증 통과 시 즉시 APPROVED(데모). */
export type VerificationStatusCode = 'PENDING' | 'APPROVED' | 'REJECTED';

/** POST /api/v1/members/me/verification 요청 body. */
export interface VerificationSubmitBody {
  identity_document_type: IdentityDocumentTypeCode;
  document_number: string;
  /**
   * 사전 업로드된 신분증 이미지 S3 key. **현재 선택(OCR 미도입 데모 정책)** — 미전송 가능(백엔드 #152).
   * 향후 이미지 업로드 도입 시 필수로 복구.
   */
  s3_key?: string;
}

/** POST 응답 data — 형식 검증 통과 시 즉시 APPROVED + 인증 배지 + 자동 지갑 개설(BE #152). */
export interface VerificationSubmitResult {
  status: VerificationStatusCode;
  submitted_at: string;
}

/** GET 응답 data — 가장 최근 인증 1건. */
export interface VerificationStatusResult {
  identity_document_type: IdentityDocumentTypeCode;
  status: VerificationStatusCode;
  /** 검토 시각. 미검토(PENDING)면 null. */
  reviewed_at: string | null;
  created_at: string;
}

// ---------- 내 프로필 (이슈 #108 가드 SSOT + #91 마이페이지) ----------

/**
 * GET /api/v1/members/me 응답 (docs/auth/api-spec.md §8 + ProfileResponse DTO).
 *
 * 자동 생성 타입(@/types/api/member)이 camelCase로 떨어져 실제 응답과 안 맞아
 * 인라인으로 snake_case 명시 (README §2 참고).
 *
 * 이슈 #108 — VerifiedRoute/HomePage 잠금 가드가 본 응답의 {@code is_verified}를 SSOT로 사용한다.
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
  /**
   * 마일스톤 기반 신뢰등급. 값: 'NEWCOMER' | 'VERIFIED' (Phase 1).
   * 레거시 생활온도(temperature_grade) 폐기 — BE #193 배포 전 응답엔 없을 수 있어 optional.
   * TODO: BE #193 배포 후 openapi 재생성 필요 (@/types/api/member의 trustGrade도 함께).
   */
  trust_grade?: string;
  /** 프로필 사진 URL. 이미지 도메인 미구현으로 현재 항상 null. */
  profile_image_url: string | null;
  /** 가입 일시 (ISO 8601 UTC Z). */
  created_at: string;
}

/**
 * PATCH /api/v1/members/me 요청 body (백엔드 ProfileUpdateRequest — api-spec §9).
 *
 * 모든 필드 필수(@NotBlank) — 닉네임/언어 빈 값은 400 COMMON4001. 자기소개(bio)만 선택값(빈 문자열 가능).
 * 부분 수정 의미라도 클라가 변경 안 한 필드는 현재 값을 그대로 다시 보내야 한다(백엔드 SSOT).
 */
export interface ProfileUpdateBody {
  /** 닉네임 (1~50자, NotBlank). 다른 회원이 사용 중이면 409 MEMBER4003. */
  nickname: string;
  /** 주 사용 언어 (BCP 47, 1~10자, 예: "ko" / "vi"). NotBlank. */
  language: string;
  /** 자기소개 (최대 200자, nullable). 빈 문자열 또는 미입력 가능. */
  bio: string | null;
}

/** GET/PATCH /api/v1/members/me/language 응답 본문. */
export interface LanguageResponse {
  /** BCP 47 코드 (예: "ko"). */
  language: string;
}

// ---------- 신뢰등급 마일스톤 (Phase 2 — FE-4 / 백엔드 BE-6) ----------

/**
 * 마일스톤 종류. 백엔드 카탈로그 SSOT — Phase 2는 3종 (기획서 §3-1 Lv2~4 순차 체인).
 *
 * TODO: BE-6 (GET /members/me/trust-milestones) 배포 후 openapi 재생성 필요
 *   (@/types/api/member에 자동 생성 타입이 생기면 본 수동 타입과 대조).
 */
export type TrustMilestoneType =
  | 'ID_VERIFIED'
  | 'BANK_ACCOUNT_CONNECTED'
  | 'FIRST_TRANSACTION_COMPLETED';

/** 마일스톤 1건 — 미달성 항목도 카탈로그에 포함된다(프론트가 "다음 단계"를 그리기 위함). */
export interface TrustMilestone {
  milestone_type: TrustMilestoneType;
  achieved: boolean;
  /** 달성 시각(ISO 8601 UTC Z). 미달성이거나 달성 시각을 모를 때 null. */
  achieved_at: string | null;
}

/** GET /api/v1/members/me/trust-milestones 응답 data. */
export interface TrustMilestonesResponse {
  /** 현재 신뢰등급 ('NEWCOMER' | 'VERIFIED' | 'CONNECTED' | 'TRUSTED'). 미지 값 대비 string. */
  trust_grade: string;
  milestones: TrustMilestone[];
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
   * 내 프로필 조회 — 마이페이지 표시용(#91) + 이슈 #108 is_verified 가드 SSOT.
   *
   * <p>인증 필요. JWT public_id claim으로 본인 식별.
   * 미인증(`is_verified=false`)이면 프론트가 금융 기능 진입을 차단한다(VerifiedRoute / HomePage).
   * 에러: 401 AUTH4011 / 404 MEMBER4001 — 호출 측에서 ApiException으로 처리.
   */
  getMyProfile: () => apiClient.get<unknown, ProfileResponse>('/members/me'),

  /**
   * 내 프로필 수정 — 마이페이지 프로필 편집 (api-spec §9).
   *
   * <p>닉네임/주 사용 언어/자기소개를 수정한다. 닉네임 사전 중복 확인은 {@link checkNickname}으로
   * 별도 호출; 본 API는 저장 시점에 백엔드가 다시 검증한다(다른 사용자가 그 사이 같은 닉네임을 채갔을 수 있음).
   *
   * <p>응답은 갱신된 ProfileResponse — 호출 측은 ['member','me'] 캐시를 invalidate해 화면 동기화.
   * 에러: 400 COMMON4001 / 401 AUTH4011 / 404 MEMBER4001 / 409 MEMBER4003(닉네임 중복) → ApiException.
   */
  updateMyProfile: (body: ProfileUpdateBody) =>
    apiClient.patch<unknown, ProfileResponse>('/members/me', body),

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

  /**
   * 내 주 사용 언어 조회 (200) — BCP 47 코드(소문자, 예: `ko`/`en`/`vi`/`fil`).
   *
   * <p>인증 필요. JWT public_id claim으로 본인 식별.
   * 본 응답값은 "선호 언어 메타데이터"이며 실제 화면 다국어 전환(i18n)은 별도 트랙.
   * 401 AUTH4011 / 404 MEMBER4001 → ApiException.
   */
  getLanguage: () => apiClient.get<unknown, LanguageResponse>('/members/me/language'),

  /**
   * 내 주 사용 언어 변경 (200) — BCP 47 코드 전송, 변경된 코드 반환.
   *
   * <p>프론트는 MVP 4개(`ko`/`en`/`vi`/`fil`) 화이트리스트를 `<select>`로 강제.
   * 백엔드 DB 컬럼은 VARCHAR(10) 자유문자열(확장 여지). 빈 문자열은 400 COMMON4001.
   * 401 AUTH4011 / 404 MEMBER4001 → ApiException.
   */
  updateLanguage: (language: string) =>
    apiClient.patch<unknown, LanguageResponse>('/members/me/language', { language }),

  /**
   * 회원 탈퇴 (200) — 로컬 soft-delete(deleted_at) + IdP(Authentik) 비활성화(방식 B).
   *
   * <p>탈퇴 후 호출 측은 로컬 토큰 정리 + Authentik end_session 호출(`startLogout`).
   * IdP 연동 실패 시 500 COMMON5000(로컬 무변경) → ApiException으로 throw돼
   * 사용자에게 다시 시도 안내. 인증 누락 401 AUTH4011 / 회원 없음 404 MEMBER4001.
   */
  withdraw: () => apiClient.delete<unknown, void>('/members/me'),

  /**
   * 내 신뢰등급 마일스톤 현황 조회 (Phase 2 — FE-4 등급 바텀시트 전용).
   *
   * <p>현재 등급 + 전체 마일스톤 카탈로그(미달성 포함)를 반환한다. 백엔드 BE-6 배포 전엔
   * 404/네트워크 에러가 나며, 호출 측(바텀시트)은 재시도 안내로 폴백한다(Phase 1 테두리 표시는 무영향).
   * 에러: 401 AUTH4011 / 404 MEMBER4001 → ApiException.
   *
   * <p>TODO: BE-6 배포 후 openapi 재생성 필요 (응답 형태 변경 시 본 수동 타입 갱신).
   */
  getTrustMilestones: () =>
    apiClient.get<unknown, TrustMilestonesResponse>('/members/me/trust-milestones'),

  // TODO: 다음 사이클 — 프로필 수정(PATCH /members/me) 등
};

/**
 * 신분증 인증 API (이슈 #108 / 백엔드 #152).
 *
 * <p>{@link verificationApi.submit}는 형식 검증 통과 시 즉시 APPROVED + 인증 배지 부여 + wallet-service에
 * 전자지갑 자동 개설을 트리거한다(BE 사이드이펙트). OCR 미도입 데모 단계라 {@code s3_key}는 선택값이다.
 *
 * <p>에러 코드(ApiException으로 throw):
 * - 400 COMMON4001 — 신분증 번호 형식 불일치 / 잘못된 유형 / 필수 필드 누락
 * - 401 AUTH4011 — 인증 누락(interceptor가 로그인 페이지로 자동 이동)
 * - 409 COMMON4091 — 이미 진행중/승인된 인증 존재(중복 제출)
 * - 404 MEMBER4001 — 회원/인증 이력 없음 (getStatus 한정)
 */
export const verificationApi = {
  /**
   * 신분증 인증 요청 (201). 형식 검증 통과 시 즉시 APPROVED + 인증 배지 + 자동 지갑 개설(BE #152 fail-open).
   *
   * <p>{@code s3_key}는 OCR 미도입 단계라 미전송 가능. 향후 이미지 업로드 도입 시 필수.
   */
  submit: (body: VerificationSubmitBody) =>
    apiClient.post<unknown, VerificationSubmitResult>('/members/me/verification', body),

  /**
   * 인증 상태 조회 (200) — 가장 최근 인증 1건.
   *
   * <p>인증 이력이 없으면 404 MEMBER4001. 호출 측에서 ApiException 처리.
   */
  getStatus: () => apiClient.get<unknown, VerificationStatusResult>('/members/me/verification'),
};
