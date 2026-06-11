import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { TrustMilestone, TrustMilestoneType } from '@/api/member';
import { ROUTES } from '@/constants/routes';
import { useTrustMilestones } from '@/hooks/useTrustMilestones';
import type { AvatarTone } from '@/types/community';
import { trustGradeToLabelKey, trustGradeToTone } from '@/utils/trustGrade';
import styles from './TrustGradeSheet.module.css';

interface TrustGradeSheetProps {
  /** 시트 오픈 여부. 닫혀 있으면 렌더하지 않고 API도 호출하지 않는다(useTrustMilestones enabled 게이트). */
  isOpen: boolean;
  onClose: () => void;
  /**
   * API 실패/로딩 중 현재 등급 미리보기에 쓸 폴백 등급 (useMyProfile의 trust_grade).
   * 마일스톤 API(BE-6) 미배포 상태에서도 미리보기만큼은 Phase 1 데이터로 그린다.
   */
  fallbackGrade?: string;
}

/** 순차 체인 마일스톤 표시 순서 — 기획서 §3-1 (신원 → 금융수단 → 실거래). */
const CHAIN_MILESTONE_ORDER: TrustMilestoneType[] = [
  'ID_VERIFIED',
  'BANK_ACCOUNT_CONNECTED',
  'FIRST_TRANSACTION_COMPLETED',
];

/** Phase 3 GOLD 보너스 마일스톤 4종 — 기획서 §3-2. */
const BONUS_MILESTONE_ORDER: TrustMilestoneType[] = [
  'DOCUMENT_ANALYZED',
  'COMMUNITY_ACTIVE',
  'TRANSACTION_FIVE_COMPLETED',
  'ACCOUNT_NINETY_DAYS',
];

/**
 * 다음 미달성 마일스톤 → CTA 이동 경로.
 * ACCOUNT_NINETY_DAYS는 시간 기반 — CTA 없음(null).
 */
const MILESTONE_CTA_ROUTE: Record<TrustMilestoneType, string | null> = {
  ID_VERIFIED: ROUTES.MYPAGE_BADGE,
  BANK_ACCOUNT_CONNECTED: ROUTES.CHARGE_ADD_ACCOUNT,
  FIRST_TRANSACTION_COMPLETED: ROUTES.CHARGE,
  DOCUMENT_ANALYZED: ROUTES.DOC_ANALYSIS,
  COMMUNITY_ACTIVE: ROUTES.COMMUNITY_WRITE,
  TRANSACTION_FIVE_COMPLETED: ROUTES.CHARGE,
  ACCOUNT_NINETY_DAYS: null,
};

/** 신뢰등급 톤 → 미리보기 테두리 클래스. MyPage/FeedPost와 동일 팔레트(utils/trustGrade.ts 주석). */
const TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.toneVerified,
  best: styles.toneConnected,
  purple: styles.toneTrusted,
  gold: styles.toneGold,
  default: styles.toneNewcomer,
};

/**
 * 마이페이지 등급 바텀시트 (Phase 2+3 — FE-4, 기획서 §4-2 활성화 퍼널 장치).
 *
 * <p>내용 4단:
 * ① 현재 등급 미리보기 — 테두리 스타일 + 등급명
 * ② 순차 체인 체크리스트 (Lv2→Lv4) + CTA
 * ③ GOLD 보너스 섹션 (4종 중 2개 이상 달성 시 Lv5 GOLD)
 * ④ GOLD 달성 축하 또는 GOLD CTA
 */
export default function TrustGradeSheet({ isOpen, onClose, fallbackGrade }: TrustGradeSheetProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTrustMilestones(isOpen);

  if (!isOpen) return null;

  // 등급 미리보기 — API 응답 우선, 없으면(로딩/에러) 프로필의 Phase 1 값으로 폴백.
  const grade = data?.trust_grade ?? fallbackGrade;
  const toneClass = TONE_CLASS[trustGradeToTone(grade)] ?? styles.toneNewcomer;
  const isGold = grade === 'GOLD';

  const formatAchievedDate = (iso: string): string =>
    new Date(iso).toLocaleDateString(i18n.language);

  // 순차 체인: API에 없는 항목은 제거 (미배포 방어).
  const chainMilestones: TrustMilestone[] = CHAIN_MILESTONE_ORDER.flatMap((type) => {
    const found = data?.milestones.find((m) => m.milestone_type === type);
    return found ? [found] : [];
  });

  // 보너스 마일스톤: API 응답에 없어도 미달성으로 채워서 항상 4개 표시.
  // 백엔드 보너스 배포 전 상태에서도 섹션이 보이도록 폴백 처리.
  const bonusMilestones: TrustMilestone[] = BONUS_MILESTONE_ORDER.map((type) => {
    const found = data?.milestones.find((m) => m.milestone_type === type);
    return found ?? { milestone_type: type, achieved: false, achieved_at: null };
  });

  // 순차 체인의 첫 미달성 마일스톤 1개만 CTA로 노출.
  const nextChainMilestone = chainMilestones.find((m) => !m.achieved)?.milestone_type;
  const chainAllDone = chainMilestones.length > 0 && !nextChainMilestone;

  // 보너스 달성 카운트 (GOLD 조건: 2개 이상).
  const bonusAchievedCount = bonusMilestones.filter((m) => m.achieved).length;
  const nextBonusMilestone = bonusMilestones.find(
    (m) => !m.achieved && MILESTONE_CTA_ROUTE[m.milestone_type] !== null
  )?.milestone_type;

  const renderMilestoneItem = (m: TrustMilestone) => (
    <li key={m.milestone_type} className={styles.item}>
      <span
        className={`${styles.check} ${m.achieved ? styles.checkOn : styles.checkOff}`}
        aria-hidden
      >
        {m.achieved ? '✓' : ''}
      </span>
      <div className={styles.itemBody}>
        <div className={styles.itemName}>
          {t(`trust.sheet.milestones.${m.milestone_type}.name`)}
        </div>
        <div className={styles.itemMeta}>
          {m.achieved
            ? m.achieved_at
              ? t('trust.sheet.achievedAt', { date: formatAchievedDate(m.achieved_at) })
              : t('trust.sheet.achieved')
            : t(`trust.sheet.milestones.${m.milestone_type}.next`)}
        </div>
      </div>
    </li>
  );

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={t('trust.sheet.aria')}
      >
        <div className={styles.header}>
          <div className={styles.handle} aria-hidden />
          <div className={styles.headerRow}>
            <div className={styles.title}>{t('trust.sheet.title')}</div>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label={t('trust.sheet.close')}
            >
              ×
            </button>
          </div>
        </div>

        <div className={styles.body}>
          {/* ① 현재 등급 미리보기 */}
          <div className={styles.gradePreview}>
            <div className={`${styles.previewAvatar} ${toneClass}`} aria-hidden />
            <div className={styles.gradeName}>{t(trustGradeToLabelKey(grade))}</div>
          </div>

          {isLoading && <p className={styles.stateText}>{t('trust.sheet.loading')}</p>}

          {isError && (
            <div className={styles.errorBox}>
              <p className={styles.stateText}>{t('trust.sheet.loadError')}</p>
              <button type="button" className={styles.retryBtn} onClick={() => refetch()}>
                {t('trust.sheet.retry')}
              </button>
            </div>
          )}

          {data && (
            <>
              {/* ② 순차 체인 체크리스트 (Lv2→Lv4) */}
              <ul className={styles.checklist}>{chainMilestones.map(renderMilestoneItem)}</ul>

              {/* 체인 CTA — 미달성 체인이 있으면 안내, 체인 완료면 숨김(GOLD 섹션에서 처리) */}
              {nextChainMilestone && (
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() => {
                    const route = MILESTONE_CTA_ROUTE[nextChainMilestone];
                    if (route) navigate(route);
                  }}
                >
                  {t(`trust.sheet.cta.${nextChainMilestone}`)}
                </button>
              )}

              {/* ③ GOLD 보너스 섹션 — 체인 전체 달성 후 노출 (API 미배포여도 표시) */}
              {chainAllDone && (
                <div className={styles.goldSection}>
                  <div className={styles.goldSectionHeader}>
                    <span className={styles.goldIcon}>⭐</span>
                    <div>
                      <div className={styles.goldSectionTitle}>
                        {t('trust.sheet.goldSection.title')}
                      </div>
                      <div className={styles.goldSectionSubtitle}>
                        {t('trust.sheet.goldSection.subtitle')}
                      </div>
                    </div>
                    <div className={styles.goldProgress}>
                      <span className={bonusAchievedCount >= 2 ? styles.goldProgressDone : ''}>
                        {bonusAchievedCount}
                      </span>
                      /4
                    </div>
                  </div>
                  <ul className={styles.checklist}>{bonusMilestones.map(renderMilestoneItem)}</ul>

                  {/* ④ GOLD CTA */}
                  {isGold ? (
                    <p className={styles.allDone}>{t('trust.sheet.allDone')}</p>
                  ) : nextBonusMilestone ? (
                    <button
                      type="button"
                      className={`${styles.ctaBtn} ${styles.ctaBtnGold}`}
                      onClick={() => {
                        const route = MILESTONE_CTA_ROUTE[nextBonusMilestone];
                        if (route) navigate(route);
                      }}
                    >
                      {t(`trust.sheet.cta.${nextBonusMilestone}`)}
                    </button>
                  ) : null}
                </div>
              )}

              {/* 체인 미완료 + 보너스 없는 경우 allDone은 never — 안전망 */}
              {chainAllDone && bonusMilestones.length === 0 && isGold && (
                <p className={styles.allDone}>{t('trust.sheet.allDone')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
