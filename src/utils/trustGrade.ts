import type { AvatarTone } from '@/types/community';

/**
 * 마일스톤 기반 신뢰등급 (이슈 #174/#175 — 레거시 생활온도 기획 폐기 후 교체).
 *
 * Phase 1 등급 2개 + Phase 2 등급 2개 (기획서 §3-1, 순차 체인):
 * - NEWCOMER: 회색 · 점선 테두리 (프로필 미완성 시그널 — 부정 표현 아님)
 * - VERIFIED: 초록 실선 테두리 (신분증 인증)
 * - CONNECTED: 파랑 실선 테두리 (계좌 연결)
 * - TRUSTED: 보라 실선 테두리 (첫 거래 완료)
 *
 * 백엔드 Phase 2(BE-5) 배포 전이라 응답에 CONNECTED/TRUSTED가 없을 수 있다 — 미지 값은 회색 폴백.
 */
export type TrustGrade = 'NEWCOMER' | 'VERIFIED' | 'CONNECTED' | 'TRUSTED' | 'GOLD';

/**
 * 신뢰등급 → 아바타 테두리 톤 매핑.
 *
 * 톤 → 색 결정 근거(2026-06):
 * - 'good'  = 초록 계열. RecurringTransferSetupPage.module.css `.avatarGood { background: #22c55e }`이
 *   리포 내 'good' 톤의 초록 선례. (TransferAppPage Phase 3 정리 후 동일 색 사용.)
 * - 'best'  = 파랑 계열. RecurringTransferSetupPage `.avatarBest { background: #0b66ff }` +
 *   `.avatarBig.avatarBest { border-color: #2563eb }`, TransferAppPage `.avatarBest { border-color: #2563eb }`
 *   — 리포 내 'best' 톤은 일관되게 파랑.
 * - 'purple' = 보라 계열. Phase 2 FE-5에서 신설. 색상 #7c3aed (Tailwind violet-600 계열).
 * - 'gold'  = 금색 계열. Phase 3 GOLD 등급 신설. 색상 #f59e0b (Tailwind amber-400) + glow.
 * - 'default' = 회색 계열. 커뮤니티 AvatarTone의 무채색 폴백 값.
 *
 * 누락(undefined)·미지 값은 모두 회색('default')으로 폴백한다 — BE 미배포/구버전 응답 안전망.
 */
export function trustGradeToTone(grade?: string): AvatarTone {
  switch (grade) {
    case 'VERIFIED':
      return 'good';
    case 'CONNECTED':
      return 'best';
    case 'TRUSTED':
      return 'purple';
    case 'GOLD':
      return 'gold';
    case 'NEWCOMER':
    default:
      return 'default';
  }
}

/** 등급 순서 (숫자가 클수록 높은 등급). 비교·상승 감지에 사용. */
const GRADE_ORDER: Record<string, number> = {
  NEWCOMER: 0,
  VERIFIED: 1,
  CONNECTED: 2,
  TRUSTED: 3,
  GOLD: 4,
};

/**
 * 이전 등급보다 현재 등급이 상승했는지 반환.
 * 둘 중 하나라도 미지 값이면 false.
 */
export function isGradeUpgrade(prev: string | undefined, next: string | undefined): boolean {
  if (!prev || !next) return false;
  const prevOrder = GRADE_ORDER[prev] ?? -1;
  const nextOrder = GRADE_ORDER[next] ?? -1;
  return nextOrder > prevOrder;
}

/**
 * 신뢰등급 → i18n 등급명 라벨 키 (trust.grade.*).
 *
 * 누락·미지 값은 NEWCOMER 라벨로 폴백 — {@link trustGradeToTone}의 회색 폴백과 짝을 맞춘다.
 */
export function trustGradeToLabelKey(grade?: string): string {
  switch (grade) {
    case 'VERIFIED':
      return 'trust.grade.verified';
    case 'CONNECTED':
      return 'trust.grade.connected';
    case 'TRUSTED':
      return 'trust.grade.trusted';
    case 'GOLD':
      return 'trust.grade.gold';
    case 'NEWCOMER':
    default:
      return 'trust.grade.newcomer';
  }
}
