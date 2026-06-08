// 회원가입/Google 추가정보: 네이티브 표기 + 기타
export const SIGNUP_LANGUAGES = [
  '中文',
  'Tiếng Việt',
  'ภาษาไทย',
  'English',
  'Filipino',
  'Bahasa Indonesia',
  '기타',
] as const;

// 마이페이지/프로필 설정: 한국어 라벨
export const SETTING_LANGUAGES = ['한국어', '중국어', '베트남어', '태국어', '영어'] as const;

/**
 * 백엔드 BCP 47 언어 코드 → 화면 한국어 라벨 매핑.
 * LanguageSettingsPage / ProfileEditPage에서 공유.
 */
export const LANGUAGE_CODE_TO_LABEL: Record<string, string> = {
  ko: '한국어',
  zh: '중국어',
  vi: '베트남어',
  th: '태국어',
  en: '영어',
};

/**
 * 화면 한국어 라벨 → 백엔드 BCP 47 코드 역매핑 (저장 시 사용).
 * CODE_TO_LABEL에서 자동 생성 — 정합 깨질 일 없음.
 */
export const LANGUAGE_LABEL_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(LANGUAGE_CODE_TO_LABEL).map(([code, label]) => [label, code])
);
