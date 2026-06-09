import { franc } from 'franc-min';

/**
 * 게시글 본문에서 작성 언어를 감지한다 (이슈 #160 — 작성 언어 자동 판정).
 *
 * <p>배경: 앱 UI 언어(i18n.language)는 실제 본문 언어와 다를 수 있다(한국어 앱으로 영어 글 작성 등).
 * 그래서 작성 시점에 본문 텍스트 자체에서 언어를 추정해 저장한다. 저장된 값은 상세 화면에서
 * "번역 보기" 버튼 노출 판단(원문 언어 == 현재 UI 언어면 숨김)의 기준이 된다.
 *
 * <p>franc는 ISO 639-3 코드를 반환하므로 앱 화이트리스트(ko/en/vi/fil)로 매핑한다.
 * {@code only} 옵션으로 후보를 4개로 제한해 정확도를 높인다(영어 vs 타갈로그처럼 라틴 문자만으로는
 * 구분이 어려운 쌍도 4개 안에서만 고르므로 오판이 줄어든다).
 *
 * <p>감지 실패('und' — 보통 franc 최소 길이 10자 미만이거나 후보 밖) 시 {@code fallback}을 쓴다.
 * 호출 측에서 i18n.language를 fallback으로 넘기면 기존 "앱 언어 전달" 동작으로 안전하게 되돌아간다.
 */

/** franc ISO 639-3 코드 → 앱 언어 코드. tgl(타갈로그)은 필리핀어(fil)로 매핑. */
const ISO3_TO_APP: Record<string, string> = {
  kor: 'ko',
  eng: 'en',
  vie: 'vi',
  tgl: 'fil',
};

/** 감지 후보 — i18n supportedLngs(ko/en/vi/fil)에 대응하는 ISO 639-3 코드. */
const FRANC_CANDIDATES = ['kor', 'eng', 'vie', 'tgl'];

/**
 * 언어 코드를 앱 화이트리스트(ko/en/vi/fil) 형태로 정규화한다.
 *
 * <p>i18n.language는 지역 코드가 붙은 형태(`ko-KR`, `en-US`)일 수 있는데, 백엔드 번역/작성은
 * `ko`/`en`/`vi`/`fil`만 받으므로(화이트리스트 외 COMMUNITY4003) base 서브태그만 잘라 소문자화한다.
 * `fil`처럼 하이픈이 없는 코드는 그대로 통과한다.
 */
export function normalizeAppLanguage(lng: string): string {
  return (lng || '').split('-')[0].toLowerCase();
}

/**
 * 본문 텍스트의 언어를 감지해 앱 코드(ko/en/vi/fil)로 반환한다.
 *
 * @param text 감지 대상 텍스트(제목+본문을 합쳐 넘기면 정확도가 오른다).
 * @param fallback 감지 실패 시 사용할 코드(보통 i18n.language). 지역 코드는 정규화된다.
 */
export function detectPostLanguage(text: string, fallback: string): string {
  const code = franc(text, { only: FRANC_CANDIDATES });
  return ISO3_TO_APP[code] ?? normalizeAppLanguage(fallback);
}
