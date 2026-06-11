import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Identicon from '@/components/common/Identicon';
import TopBar from '@/components/navigation/TopBar';
import TrustGradeSheet from '@/components/mypage/TrustGradeSheet';
import { useMyProfile } from '@/hooks/useMyProfile';
import { useMyVerification } from '@/hooks/useMyVerification';
import type { AvatarTone } from '@/types/community';
import { trustGradeToLabelKey, trustGradeToTone } from '@/utils/trustGrade';
import { isAdminUser } from '@/auth/tokenStore';
import { ROUTES } from '@/constants/routes';
import styles from './MyPage.module.css';

const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  best: styles.avatarConnected,
  purple: styles.avatarTrusted,
  default: styles.avatarNewcomer,
};

export default function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { data: profile, isLoading } = useMyProfile();
  const { data: verification } = useMyVerification();
  const isVerified = verification?.status === 'APPROVED';

  const [isTrustSheetOpen, setTrustSheetOpen] = useState(false);

  const MY_ACTIVITY = [
    { label: t('mypage.items.walletHistory'), path: '/mypage/wallet-history' },
    { label: t('mypage.items.exchangeHistory'), path: '/mypage/exchange-history' },
    { label: t('mypage.items.docAnalysisHistory'), path: '/mypage/doc-analysis-history' },
    { label: t('mypage.items.recurring'), path: '/recurring' },
    { label: t('mypage.items.accounts'), path: '/mypage/accounts' },
    { label: t('mypage.items.subscription'), path: '/mypage/subscription' },
  ];

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
  const avatarSeed = profile?.public_id ?? nickname;
  const trustTone = trustGradeToTone(profile?.trust_grade);
  const avatarToneClass = AVATAR_TONE_CLASS[trustTone] ?? styles.avatarNewcomer;
  const trustGradeLabel = t(trustGradeToLabelKey(profile?.trust_grade));

  return (
    <>
      <TopBar
        title={t('mypage.title')}
        onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.HOME))}
      />
      <div className={styles.noTopPad}>
        {/* Profile card */}
        <div className={styles.card}>
          <div className={styles.profileRow}>
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

      <TrustGradeSheet
        isOpen={isTrustSheetOpen}
        onClose={() => setTrustSheetOpen(false)}
        fallbackGrade={profile?.trust_grade}
      />
    </>
  );
}
