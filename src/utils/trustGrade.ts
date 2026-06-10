import type { AvatarTone } from '@/types/community';

/**
 * 마일스톤 기반 신뢰등급 (이슈 #174/#175 — 레거시 생활온도 기획 폐기 후 교체).
 *
 * Phase 1 등급은 2개:
 * - NEWCOMER: 회색 · 점선 테두리 (프로필 미완성 시그널 — 부정 표현 아님)
 * - VERIFIED: 초록 실선 테두리
 *
 * 백엔드 BE #193(member) / BE #194(community) 배포 전이라 응답에 없을 수 있다 — undefined 허용.
 */
export type TrustGrade = 'NEWCOMER' | 'VERIFIED';

/**
 * 신뢰등급 → 아바타 테두리 톤 매핑.
 *
 * 톤 → 색 결정 근거(2026-06):
 * - 'good'  = 초록 계열. RecurringTransferSetupPage.module.css `.avatarGood { background: #22c55e }`이
 *   리포 내 'good' 톤의 초록 선례. (TransferAppPage는 'mid'를 초록 테두리로 쓰지만 이는 mock 순환 배색 —
 *   Phase 3 정리 대상이라 근거로 삼지 않음.)
 * - 'default' = 회색 계열. 커뮤니티 AvatarTone의 무채색 폴백 값.
 *
 * 누락(undefined)·미지 값은 모두 회색('default')으로 폴백한다 — BE 미배포/구버전 응답 안전망.
 */
export function trustGradeToTone(grade?: string): AvatarTone {
  switch (grade) {
    case 'VERIFIED':
      return 'good';
    case 'NEWCOMER':
    default:
      return 'default';
  }
}
