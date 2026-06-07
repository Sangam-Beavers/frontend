// 플랫폼 지원 언어 — 4개 확정 (2026-06-07 결정)
// 국적 4개(KR/US/VN/PH)와 1:1 정렬. 확장 시 결정문(심규보/결정-국적언어-스코프-확정.md) 절차 따를 것.

// 회원가입/Google 추가정보: 네이티브 표기
export const SIGNUP_LANGUAGES = ['한국어', 'English', 'Tiếng Việt', 'Filipino'] as const;

// 마이페이지/프로필 설정: 한국어 라벨
export const SETTING_LANGUAGES = ['한국어', '영어', '베트남어', '필리핀어'] as const;

/** 한국어 라벨 → BCP 47 코드. 백엔드 전송용. */
export const LANGUAGE_LABEL_TO_CODE: Record<(typeof SETTING_LANGUAGES)[number], string> = {
  한국어: 'ko',
  영어: 'en',
  베트남어: 'vi',
  필리핀어: 'fil',
};

/** BCP 47 코드 → 한국어 라벨. 백엔드 응답 표시용. 매핑 못 찾으면 '한국어' fallback. */
export const LANGUAGE_CODE_TO_LABEL: Record<string, string> = {
  ko: '한국어',
  en: '영어',
  vi: '베트남어',
  fil: '필리핀어',
};

/** 네이티브 표기(SIGNUP) → BCP 47 코드. */
export const SIGNUP_LANGUAGE_LABEL_TO_CODE: Record<(typeof SIGNUP_LANGUAGES)[number], string> = {
  한국어: 'ko',
  English: 'en',
  'Tiếng Việt': 'vi',
  Filipino: 'fil',
};
