import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Identicon from '@/components/common/Identicon';
import GradeUpCelebration from '@/components/common/GradeUpCelebration';
import TrustGradeSheet from '@/components/mypage/TrustGradeSheet';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyVerification } from '@/hooks/useMyVerification';
import type { AvatarTone } from '@/types/community';
import { isGradeUpgrade, trustGradeToLabelKey, trustGradeToTone } from '@/utils/trustGrade';
import { isAdminUser } from '@/auth/tokenStore';
import { ROUTES } from '@/constants/routes';
import styles from './MyPage.module.css';

const LAST_SEEN_GRADE_KEY = 'gb_last_seen_trust_grade';

/** 신뢰등급 테두리 톤 → CSS 클래스 (FE-5). 톤→색 근거는 utils/trustGrade.ts 주석 참고. */
const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  best: styles.avatarConnected,
  purple: styles.avatarTrusted,
  gold: styles.avatarGold,
  default: styles.avatarNewcomer,
};

export default function MyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // 내 프로필 — 닉네임/아바타에 사용. 로딩 중엔 placeholder, 실패는 일단 빈값으로 표시.
  // (사이클 1: 에러 분기 단순화 — 마이페이지 진입 자체가 인증 필요라 토큰 만료는 interceptor가 /login으로 redirect.)
  const { data: profile, isLoading } = useMyProfile();
  // 인증 상태 — 닉네임 옆 '인증' / 설정 '추가 인증' 옆 '완료' 배지의 SSOT.
  // 이력 없는 신규 회원은 null이라 자연스럽게 미표시. status === 'APPROVED'일 때만 인증 완료.
  const { data: verification } = useMyVerification();
  const isVerified = verification?.status === 'APPROVED';

  // 등급 바텀시트 (FE-4) — 아바타/등급라벨 탭으로 오픈. 닫혀 있으면 마일스톤 API 미호출.
  const [isTrustSheetOpen, setTrustSheetOpen] = useState(false);

  // 등급 상승 축하 모먼트 (Phase 3) — MyPage 진입 시 lastSeen vs 현재 등급 비교, 1회 표시.
  const [celebrating, setCelebrating] = useState(false);

  // 라벨이 언어 변경마다 재계산되도록 컴포넌트 안에서 구성한다.
  const MY_ACTIVITY = [
    { label: t('mypage.items.walletHistory'), path: '/mypage/wallet-history' },
    { label: t('mypage.items.exchangeHistory'), path: '/mypage/exchange-history' },
    { label: t('mypage.items.docAnalysisHistory'), path: '/mypage/doc-analysis-history' },
    { label: t('mypage.items.recurring'), path: '/recurring' },
    { label: t('mypage.items.accounts'), path: '/mypage/accounts' },
    { label: t('mypage.items.subscription'), path: '/mypage/subscription' },
  ];

  // 설정/관리 행은 인증 상태에 따라 배지가 바뀌므로 컴포넌트 안에서 구성한다.
  // 회원 탈퇴(이슈 #148)는 마지막에 둠 — 위험 동작은 의도적으로 뒤로.
  const SETTINGS: { label: string; badge: string | null; path: string }[] = [
    {
      label: t('mypage.items.additionalCert'),
      badge: isVerified ? t('mypage.verified') : null,
      path: '/mypage/badge',
    },
    { label: t('mypage.items.language'), badge: null, path: '/mypage/language' },
    { label: t('mypage.items.withdraw'), badge: null, path: '/mypage/withdraw' },
  ];

  const isAdmin = isAdminUser();

  const ADMIN_ITEMS = [{ label: t('mypage.items.appManage'), path: ROUTES.ADMIN_APP }];

  const nickname = profile?.nickname ?? '';
  // 사진 미설정 시 닉네임 첫 글자 대신 사용자별 고유 패턴(public_id 시드)을 보여준다.
  const avatarSeed = profile?.public_id ?? nickname;

  // 신뢰등급 테두리 (이슈 #174 + Phase 2 FE-5) — NEWCOMER 회색 점선 / VERIFIED 초록 /
  // CONNECTED 파랑 / TRUSTED 보라 / GOLD 금색 실선. 누락·미지 값은 회색('default')으로 폴백.
  const trustTone = trustGradeToTone(profile?.trust_grade);
  const avatarToneClass = AVATAR_TONE_CLASS[trustTone] ?? styles.avatarNewcomer;
  const trustGradeLabel = t(trustGradeToLabelKey(profile?.trust_grade));

  // 등급 상승 감지 (Phase 3) — 프로필 로드 완료 시 1회 체크.
  useEffect(() => {
    if (!profile?.trust_grade) return;
    const lastSeen = localStorage.getItem(LAST_SEEN_GRADE_KEY) ?? undefined;
    if (isGradeUpgrade(lastSeen, profile.trust_grade)) {
      setCelebrating(true);
    }
    localStorage.setItem(LAST_SEEN_GRADE_KEY, profile.trust_grade);
  }, [profile?.trust_grade]);

  return (
    <>
      <div className={styles.noTopPad}>
        {/* Custom top bar */}
        <div className={styles.topBar}>
          <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
            ‹
          </button>
          <span className={styles.topTitle}>{t('mypage.title')}</span>
          <div style={{ width: 40 }} />
        </div>

        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.profileRow}>
            {/* 아바타 탭 → 등급 바텀시트 (FE-4, 기획서 §4-2) */}
            <button
              type="button"
              className={styles.avatarBtn}
              onClick={() => setTrustSheetOpen(true)}
              aria-label={t('trust.sheet.open')}
            >
              <div className={`${styles.avatar} ${avatarToneClass}`}>
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="" className={styles.avatarImg} />
                ) : (
                  <Identicon seed={avatarSeed} />
                )}
              </div>
            </button>
            <div className={styles.profileInfo}>
              <div className={styles.profileName}>
                {isLoading ? t('mypage.loading') : nickname}
                {isVerified && (
                  <span className={styles.verifiedPill}>{t('mypage.verifiedBadge')}</span>
                )}
              </div>
              {profile && (
                <button
                  type="button"
                  className={styles.trustLabel}
                  onClick={() => setTrustSheetOpen(true)}
                >
                  {trustGradeLabel} ›
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => navigate('/mypage/profile')}
          >
            {t('mypage.profileEdit')}
          </button>
        </div>

        {/* 관리자 전용 섹션 — 최상단 배치. JWT groups: ["admin"] 인 경우에만 표시 */}
        {isAdmin && (
          <>
            <div className={styles.section}>앱 관리</div>
            <div className={styles.list}>
              {ADMIN_ITEMS.map((item) => (
                <div key={item.path} className={styles.item} onClick={() => navigate(item.path)}>
                  <div className={styles.itemTitle}>{item.label}</div>
                  <span className={styles.arrow}>›</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className={styles.section}>{t('mypage.sectionActivity')}</div>

        <div className={styles.list}>
          {MY_ACTIVITY.map((item) => (
            <div key={item.label} className={styles.item} onClick={() => navigate(item.path)}>
              <div className={styles.itemTitle}>{item.label}</div>
              <span className={styles.arrow}>›</span>
            </div>
          ))}
        </div>

        <div className={styles.section}>{t('mypage.sectionSettings')}</div>

        <div className={styles.list}>
          {SETTINGS.map((item) => (
            <div key={item.label} className={styles.item} onClick={() => navigate(item.path)}>
              <div className={styles.itemTitle}>{item.label}</div>
              {item.badge ? (
                <span className={styles.pill}>{item.badge}</span>
              ) : (
                <span className={styles.arrow}>›</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 등급 바텀시트 (FE-4) — MobileScreen 안 절대 위치. 닫혀 있으면 null 렌더 + API 미호출. */}
      <TrustGradeSheet
        isOpen={isTrustSheetOpen}
        onClose={() => setTrustSheetOpen(false)}
        fallbackGrade={profile?.trust_grade}
      />

      {/* 등급 상승 축하 모먼트 (Phase 3) — 컨페티 + 토스트. 1회 표시 후 자동 dismiss. */}
      {celebrating && (
        <GradeUpCelebration gradeName={trustGradeLabel} onDismiss={() => setCelebrating(false)} />
      )}
    </>
  );
}
