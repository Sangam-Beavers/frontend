// 회원가입/Google 추가정보 + 마이페이지: 이슈 A 결정문에 따라 4개 국가 MVP 확정
// (한국·미국·베트남·필리핀)
//
// LANGUAGE_LABEL_TO_CODE / LANGUAGE_CODE_TO_LABEL:
//   서버는 ko/en/vi/fil 4종 코드만 사용. UI는 한국어 라벨로 노출.

export const SIGNUP_LANGUAGES = ['한국어', 'English', 'Tiếng Việt', 'Filipino'] as const;
export type SignupLanguage = (typeof SIGNUP_LANGUAGES)[number];

// 마이페이지/프로필 설정: 한국어 라벨 (UI 표시용)
export const SETTING_LANGUAGES = ['한국어', '영어', '베트남어', '필리핀어'] as const;
export type SettingLanguage = (typeof SETTING_LANGUAGES)[number];

// 언어 코드 ↔ 한국어 라벨 양방향 매핑
// 서버 PATCH /members/me/language 의 body는 코드, UI는 라벨
export const LANGUAGE_LABEL_TO_CODE: Record<SettingLanguage, string> = {
  한국어: 'ko',
  영어: 'en',
  베트남어: 'vi',
  필리핀어: 'fil',
};

export const LANGUAGE_CODE_TO_LABEL: Record<string, SettingLanguage> = {
  ko: '한국어',
  en: '영어',
  vi: '베트남어',
  fil: '필리핀어',
};

// 각 언어 고유의 자국어 표기 — UI 언어와 무관하게 항상 이 이름으로 표시
export const LANGUAGE_NATIVE_NAMES: Record<string, string> = {
  ko: '한국어',
  en: 'English',
  vi: 'Tiếng Việt',
  fil: 'Filipino',
};
