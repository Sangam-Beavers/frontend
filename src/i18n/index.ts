import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ko from './locales/ko.json';
import en from './locales/en.json';
import vi from './locales/vi.json';
import fil from './locales/fil.json';

/**
 * i18next 전역 초기화 (이슈 #153).
 *
 * <p>전략:
 * <ul>
 *   <li><b>fallbackLng = 'ko'</b> — 키 누락 시 한국어로 폴백 (베이스 사전).</li>
 *   <li><b>supportedLngs</b> — 화이트리스트 4개 (`ko`/`en`/`vi`/`fil`). MVP 확정 스코프(이슈 #138).</li>
 *   <li><b>LanguageDetector</b> — 1순위 localStorage('i18nextLng'), 2순위 브라우저 언어.
 *       로그인 후엔 {@link import('@/hooks/useLanguageSync').useLanguageSync}가 서버값(members.language)으로 덮어쓴다.</li>
 *   <li><b>namespace 단일('translation')</b> — MVP는 단일 사전 파일. 확장 시 페이지별 분리.</li>
 *   <li><b>interpolation.escapeValue = false</b> — React가 이미 XSS 이스케이프 처리하므로 i18next는 미사용.</li>
 * </ul>
 *
 * <p>main.tsx 에서 import 만 하면 자동 초기화 (사이드이펙트).
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ko: { translation: ko },
      en: { translation: en },
      vi: { translation: vi },
      fil: { translation: fil },
    },
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en', 'vi', 'fil'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    returnNull: false,
  });

export default i18n;
