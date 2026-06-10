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

/** 마일스톤 표시 순서 — 기획서 §3-1 순차 체인(신원 → 금융수단 → 실거래). API 순서에 의존하지 않는다. */
const MILESTONE_ORDER: TrustMilestoneType[] = [
  'ID_VERIFIED',
  'BANK_ACCOUNT_CONNECTED',
  'FIRST_TRANSACTION_COMPLETED',
];

/**
 * 다음 미달성 마일스톤 → CTA 이동 경로.
 * - ID_VERIFIED → 신분증 인증(추가 인증) 화면
 * - BANK_ACCOUNT_CONNECTED → 계좌 등록(AddAccount) 화면
 * - FIRST_TRANSACTION_COMPLETED → 충전(Charge) 화면
 * 충전/계좌 라우트는 VerifiedRoute 보호라 미인증 사용자는 자연스럽게 인증 화면으로 유도된다.
 */
const MILESTONE_CTA_ROUTE: Record<TrustMilestoneType, string> = {
  ID_VERIFIED: ROUTES.MYPAGE_BADGE,
  BANK_ACCOUNT_CONNECTED: ROUTES.CHARGE_ADD_ACCOUNT,
  FIRST_TRANSACTION_COMPLETED: ROUTES.CHARGE,
};

/** 신뢰등급 톤 → 미리보기 테두리 클래스. MyPage/FeedPost와 동일 팔레트(utils/trustGrade.ts 주석). */
const TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.toneVerified,
  best: styles.toneConnected,
  purple: styles.toneTrusted,
  default: styles.toneNewcomer,
};

/**
 * 마이페이지 등급 바텀시트 (Phase 2 — FE-4, 기획서 §4-2 활성화 퍼널 장치).
 *
 * <p>ChatbotSheet의 백드롭 + 절대 위치 시트 패턴 재사용. MobileScreen(position: relative) 안에서
 * 절대 위치로 떠서 max-width 430px 모바일 레이아웃을 자동 준수한다.
 *
 * <p>내용 3단:
 * ① 현재 등급 — 테두리 스타일 미리보기 + 등급명
 * ② 마일스톤 체크리스트 — 달성=체크+달성일, 미달성=다음 안내(부정 표현 금지 — "~하면 ~ 테두리를 받아요" 톤)
 * ③ 다음 미달성 마일스톤 CTA 1개 — 해당 행동 화면으로 네비게이션
 *
 * <p>BE-6 미배포/일시 오류 시: 미리보기는 fallbackGrade(Phase 1 데이터)로 유지하고
 * 체크리스트 자리에 가벼운 재시도 안내만 보여준다(마이페이지 테두리 표시는 무영향).
 */
export default function TrustGradeSheet({ isOpen, onClose, fallbackGrade }: TrustGradeSheetProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useTrustMilestones(isOpen);

  if (!isOpen) return null;

  // 등급 미리보기 — API 응답 우선, 없으면(로딩/에러) 프로필의 Phase 1 값으로 폴백.
  const grade = data?.trust_grade ?? fallbackGrade;
  const toneClass = TONE_CLASS[trustGradeToTone(grade)] ?? styles.toneNewcomer;

  // 카탈로그 순서 고정 + 미지 타입(향후 Phase 3 추가분 등) 필터 — i18n 키 누락 방어.
  const milestones: TrustMilestone[] = MILESTONE_ORDER.flatMap((type) => {
    const found = data?.milestones.find((m) => m.milestone_type === type);
    return found ? [found] : [];
  });

  // 순차 체인의 첫 미달성 마일스톤 1개만 CTA로 노출.
  const nextMilestone = milestones.find((m) => !m.achieved)?.milestone_type;

  const formatAchievedDate = (iso: string): string =>
    new Date(iso).toLocaleDateString(i18n.language);

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
              {/* ② 마일스톤 체크리스트 */}
              <ul className={styles.checklist}>
                {milestones.map((m) => (
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
                            ? t('trust.sheet.achievedAt', {
                                date: formatAchievedDate(m.achieved_at),
                              })
                            : t('trust.sheet.achieved')
                          : t(`trust.sheet.milestones.${m.milestone_type}.next`)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* ③ 다음 마일스톤 CTA — 미달성이 없으면 축하 문구 */}
              {nextMilestone ? (
                <button
                  type="button"
                  className={styles.ctaBtn}
                  onClick={() => navigate(MILESTONE_CTA_ROUTE[nextMilestone])}
                >
                  {t(`trust.sheet.cta.${nextMilestone}`)}
                </button>
              ) : (
                <p className={styles.allDone}>{t('trust.sheet.allDone')}</p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
