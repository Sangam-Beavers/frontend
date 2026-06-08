import { ApiException } from '@/api';
import type { TFunction } from 'i18next';

/**
 * 커뮤니티 게시글·댓글 동적 번역 도메인 에러 → 사용자 메시지 매핑 (이슈 #160).
 *
 * <p>i18n 키 `community.postDetail.translateError*` 사용. 매핑 없는 code는
 * 백엔드 message 그대로 노출. ApiException이 아니면 일반 폴백 문구.
 *
 * <p>백엔드 에러 코드(api-spec):
 * <ul>
 *   <li>COMMUNITY4001 — 없는 게시글</li>
 *   <li>COMMUNITY4003 — 지원하지 않는 언어</li>
 *   <li>COMMUNITY4004 — 본문이 너무 김</li>
 * </ul>
 */
export function translationErrorMessage(err: unknown, t: TFunction): string {
  if (err instanceof ApiException) {
    switch (err.code) {
      case 'COMMUNITY4001':
        return t('community.postDetail.translateErrorNotFound');
      case 'COMMUNITY4003':
        return t('community.postDetail.translateErrorUnsupportedLanguage');
      case 'COMMUNITY4004':
        return t('community.postDetail.translateErrorTooLong');
      default:
        return t('community.postDetail.translateError');
    }
  }
  return t('community.postDetail.translateError');
}
