// 회원가입/Google 추가정보: 성별·연령대 선택지 (이슈 #203 / 백엔드 #203)
//
// value = 백엔드 enum 코드(Gender / AgeRange SSOT). 서버 전송값이며 절대 번역하지 않는다.
// label = UI 표시용 한국어 라벨(nationalities.ts와 동일하게 라벨은 하드코딩).
//   → <option value={value}>{label}</option> 패턴으로 코드만 서버에 보낸다(라벨 전송 금지).

export interface SelectOption {
  value: string;
  label: string;
}

/** 성별 — 백엔드 Gender enum (MALE / FEMALE). */
export const GENDERS: readonly SelectOption[] = [
  { value: 'MALE', label: '남' },
  { value: 'FEMALE', label: '여' },
] as const;

/** 연령대 — 백엔드 AgeRange enum (10년 단위 구간). */
export const AGE_RANGES: readonly SelectOption[] = [
  { value: 'TEENS', label: '10대' },
  { value: 'TWENTIES', label: '20대' },
  { value: 'THIRTIES', label: '30대' },
  { value: 'FORTIES', label: '40대' },
  { value: 'FIFTIES', label: '50대' },
  { value: 'SIXTIES_PLUS', label: '60대 이상' },
] as const;
