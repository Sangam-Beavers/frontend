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
export type TrustGrade = 'NEWCOMER' | 'VERIFIED' | 'CONNECTED' | 'TRUSTED';

/**
 * 신뢰등급 → 아바타 테두리 톤 매핑.
 *
 * 톤 → 색 결정 근거(2026-06):
 * - 'good'  = 초록 계열. RecurringTransferSetupPage.module.css `.avatarGood { background: #22c55e }`이
 *   리포 내 'good' 톤의 초록 선례. (TransferAppPage는 'mid'를 초록 테두리로 쓰지만 이는 mock 순환 배색 —
 *   Phase 3 정리 대상이라 근거로 삼지 않음.)
 * - 'best'  = 파랑 계열. RecurringTransferSetupPage `.avatarBest { background: #0b66ff }` +
 *   `.avatarBig.avatarBest { border-color: #2563eb }`, TransferAppPage `.avatarBest { border-color: #2563eb }`
 *   — 리포 내 'best' 톤은 일관되게 파랑.
 * - 'purple' = 보라 계열. AvatarTone 유니온에 값은 있으나 CSS 선례가 없어(Phase 2 — FE-5에서 신설)
 *   각 사용처에 보라 테두리 클래스를 추가했다. 색상은 리포 유일 보라 액센트인 #7c3aed
 *   (TransferAppPage — Tailwind violet-600 계열)로 통일.
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
    case 'NEWCOMER':
    default:
      return 'default';
  }
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
    case 'NEWCOMER':
    default:
      return 'trust.grade.newcomer';
  }
}

/**
 * 등급 순위 (낮음 → 높음). 미지/누락 값은 순위 없음으로 취급한다.
 * GOLD는 라벨/톤에만 존재하고 {@link TrustGrade} 유니온엔 아직 없으나(BE 미배포),
 * 향후 도입 대비해 순위표에 포함해 둔다.
 */
const GRADE_ORDER: Record<string, number> = {
  NEWCOMER: 0,
  VERIFIED: 1,
  CONNECTED: 2,
  TRUSTED: 3,
  GOLD: 4,
};

/**
 * 신뢰등급이 상승했는지 판정 — MyPage 등급 상승 축하 모먼트(Phase 3) 트리거에 사용.
 *
 * <p>{@code next}가 {@code prev}보다 순위가 높을 때만 {@code true}. 다음 경우는 모두 {@code false}다:
 * <ul>
 *   <li>{@code prev}가 없음(최초 방문) — 신규 유저 진입마다 컨페티가 터지지 않도록 축하하지 않는다.
 *       호출부는 이때도 현재 등급을 lastSeen에 저장하므로, 이후 실제 상승부터 축하된다.</li>
 *   <li>{@code next}가 없거나 순위표에 없는 미지 값 — BE 미배포/구버전 응답 안전망.</li>
 *   <li>같거나 하락 — 강등은 축하 대상 아님.</li>
 * </ul>
 *
 * @param prev 직전에 사용자가 본 등급(localStorage). 없으면 undefined.
 * @param next 현재 등급.
 */
export function isGradeUpgrade(prev?: string, next?: string): boolean {
  if (!prev || !next) return false;
  const nextRank = GRADE_ORDER[next];
  const prevRank = GRADE_ORDER[prev];
  if (nextRank === undefined || prevRank === undefined) return false;
  return nextRank > prevRank;
}
