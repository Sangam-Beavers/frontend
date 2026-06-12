import { ApiException } from '@/api';

/**
 * 신고 API 에러를 i18n 메시지 키로 변환한다.
 * COMMUNITY4006 = 중복 신고, COMMUNITY4007 = 잘못된 사유, 그 외 = unknown.
 */
export function reportErrorMessage(err: unknown, t: (key: string) => string): string {
  if (err instanceof ApiException) {
    if (err.code === 'COMMUNITY4006') return t('community.report.error.duplicate');
    if (err.code === 'COMMUNITY4007') return t('community.report.error.invalidReason');
  }
  return t('community.report.error.unknown');
}
