import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startLogout } from '@/auth/logout';
import Identicon from '@/components/common/Identicon';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { SearchIcon, SettingsIcon } from '@/components/common/icons';
import { LANGUAGE_CODE_TO_LABEL } from '@/constants/languages';
import { ROUTES } from '@/constants/routes';
import { useMyProfile } from '@/hooks/useMyProfile';
import type { AvatarTone } from '@/types/community';
import { trustGradeToTone } from '@/utils/trustGrade';
import styles from './AllMenuPage.module.css';

const NAV_KEYS = ['all', 'finance', 'documents', 'community', 'mypage', 'support'] as const;
type NavKey = (typeof NAV_KEYS)[number];

const TAB_KEY = 'allMenu_activeNav';
const SCROLL_KEY = 'allMenu_scroll';

interface MenuItem {
  labelKey: string;
  path: string;
}

const financialItems: MenuItem[] = [
  { labelKey: 'allmenu.items.appTransfer', path: '/transfer/app' },
  { labelKey: 'allmenu.items.bankTransfer', path: '/transfer/bank' },
  { labelKey: 'allmenu.items.recurringTransfer', path: '/recurring' },
  { labelKey: 'allmenu.items.chargeWithdraw', path: '/charge' },
  { labelKey: 'allmenu.items.exchange', path: '/exchange' },
  { labelKey: 'allmenu.items.exchangeHistory', path: '/mypage/exchange-history' },
  { labelKey: 'allmenu.items.walletHistory', path: '/mypage/wallet-history' },
];

const docItems: MenuItem[] = [
  { labelKey: 'allmenu.items.docAnalysis', path: '/doc-analysis' },
  { labelKey: 'allmenu.items.docHistory', path: '/mypage/doc-analysis-history' },
];

const communityItems: MenuItem[] = [
  { labelKey: 'allmenu.items.communityHome', path: ROUTES.COMMUNITY },
  { labelKey: 'community.categories.residence', path: ROUTES.COMMUNITY_RESIDENCE },
  { labelKey: 'community.categories.life', path: ROUTES.COMMUNITY_LIFE },
  { labelKey: 'community.categories.job', path: ROUTES.COMMUNITY_JOB },
  { labelKey: 'community.categories.visa', path: ROUTES.COMMUNITY_VISA },
  { labelKey: 'community.categories.country', path: ROUTES.COMMUNITY_COUNTRY },
  { labelKey: 'community.categories.free', path: ROUTES.COMMUNITY_FREE },
  { labelKey: 'allmenu.items.likedPosts', path: ROUTES.COMMUNITY_LIKED },
  { labelKey: 'allmenu.items.write', path: ROUTES.COMMUNITY_WRITE },
];

const mypageItems: MenuItem[] = [
  { labelKey: 'allmenu.items.profileSettings', path: '/mypage/profile' },
  { labelKey: 'allmenu.items.additionalCert', path: '/mypage/badge' },
  { labelKey: 'allmenu.items.languageSettings', path: '/mypage/language' },
  { labelKey: 'allmenu.items.subscription', path: '/mypage/subscription' },
  { labelKey: 'allmenu.items.accounts', path: '/mypage/accounts' },
  { labelKey: 'allmenu.items.withdraw', path: '/mypage/withdraw' },
];

const supportItems: MenuItem[] = [
  { labelKey: 'allmenu.items.notices', path: ROUTES.NOTICES },
  { labelKey: 'allmenu.items.faq', path: ROUTES.COMMUNITY_FAQ },
  { labelKey: 'allmenu.items.contact', path: ROUTES.COMMUNITY_WRITE },
];

const ALL_ITEMS: MenuItem[] = [
  ...financialItems,
  ...docItems,
  ...communityItems,
  ...mypageItems,
  ...supportItems,
];

const MENU: Record<NavKey, { titleKey: string; items: MenuItem[] }[]> = {
  all: [{ titleKey: 'allmenu.sections.all', items: ALL_ITEMS }],
  finance: [{ titleKey: 'allmenu.sections.finance', items: financialItems }],
  documents: [{ titleKey: 'allmenu.sections.documents', items: docItems }],
  community: [{ titleKey: 'allmenu.sections.community', items: communityItems }],
  mypage: [{ titleKey: 'allmenu.sections.mypage', items: mypageItems }],
  support: [{ titleKey: 'allmenu.sections.support', items: supportItems }],
};

const TAGS: MenuItem[] = [
  { labelKey: 'allmenu.tags.appTransfer', path: '/transfer/app' },
  { labelKey: 'allmenu.tags.bankTransfer', path: '/transfer/bank' },
  { labelKey: 'allmenu.tags.docAnalysis', path: '/doc-analysis' },
  { labelKey: 'allmenu.tags.residence', path: '/doc-analysis' },
];

const QUICK_LINKS: MenuItem[] = [
  { labelKey: 'allmenu.quickLinks.finance', path: ROUTES.CHARGE },
  { labelKey: 'allmenu.quickLinks.language', path: ROUTES.MYPAGE_LANGUAGE },
];

/** 신뢰등급 테두리 톤 → CSS 클래스. MyPage와 동일 팔레트(utils/trustGrade.ts 주석). */
const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  best: styles.avatarConnected,
  purple: styles.avatarTrusted,
  gold: styles.avatarGold,
  default: styles.avatarNewcomer,
};

export default function AllMenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const { t } = useTranslation();
  const { data: profile, isLoading } = useMyProfile();
  const nickname = profile?.nickname ?? '';
  const avatarSeed = profile?.public_id ?? nickname;
  // 신뢰등급 테두리 (MyPage와 동일) — 누락·미지 값은 회색('default') 폴백.
  const avatarToneClass =
    AVATAR_TONE_CLASS[trustGradeToTone(profile?.trust_grade)] ?? styles.avatarNewcomer;
  const languageLabel = profile?.language
    ? (LANGUAGE_CODE_TO_LABEL[profile.language] ?? profile.language)
    : '';

  // useSearchParams 대신 sessionStorage: setSearchParams가 location.key를 바꿔
  // useScrollRestoration이 스크롤을 0으로 리셋하는 부작용을 방지.
  // POP(뒤로가기)이면 이전 탭 복원, 새 진입이면 '전체' 탭으로 초기화.
  const [activeNav, setActiveNav] = useState<NavKey>(() => {
    if (navType === 'POP') {
      const saved = sessionStorage.getItem(TAB_KEY) as NavKey;
      return NAV_KEYS.includes(saved) ? saved : 'all';
    }
    return 'all';
  });

  const handleSetActiveNav = (key: NavKey) => {
    setActiveNav(key);
    sessionStorage.setItem(TAB_KEY, key);
  };

  // rightContent는 data-scroll-root가 아닌 자체 overflow-y: auto 컨테이너이므로
  // 전역 useScrollRestoration 대신 여기서 직접 저장·복원한다.
  const rightRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (navType !== 'POP') return;
    const saved = sessionStorage.getItem(`${SCROLL_KEY}_${location.key}`);
    if (saved !== null && rightRef.current) rightRef.current.scrollTop = Number(saved);
  }, []);

  useEffect(() => {
    const key = location.key;
    return () => {
      if (rightRef.current) {
        try {
          sessionStorage.setItem(`${SCROLL_KEY}_${key}`, String(rightRef.current.scrollTop));
        } catch {}
      }
    };
  }, [location.key]);

  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return ALL_ITEMS.filter((item) => t(item.labelKey).toLowerCase().includes(q));
  }, [searchQuery, t]);

  return (
    <>
      <div className={styles.flexColumn}>
        <ScreenHeader>
          {/* Profile header */}
          <div className={styles.head}>
            <div
              className={styles.profileRow}
              onClick={() => navigate(ROUTES.MYPAGE)}
              style={{ cursor: 'pointer' }}
            >
              <div
                className={`${styles.avatar} ${avatarToneClass}`}
                style={{ filter: `hue-rotate(${profile?.avatar_hue ?? 0}deg)` }}
              >
                {profile?.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="" className={styles.avatarImg} />
                ) : (
                  <Identicon seed={avatarSeed} />
                )}
              </div>
              <div>
                <div className={styles.username}>
                  {isLoading ? t('common.loading') : nickname || t('common.user')}
                  {profile?.is_verified && (
                    <span className={styles.verifiedBadge}>{t('mypage.verifiedBadge')}</span>
                  )}
                </div>
                <div className={styles.userMeta}>{languageLabel}</div>
              </div>
            </div>
            <div className={styles.headIcons}>
              <span
                onClick={() => navigate(ROUTES.MYPAGE)}
                style={{ cursor: 'pointer' }}
                aria-label="설정"
              >
                <SettingsIcon size={20} />
              </span>
            </div>
          </div>

          {/* Quick access */}
          <div className={styles.quickGrid}>
            {QUICK_LINKS.map((q) => (
              <span
                key={q.labelKey}
                onClick={() => {
                  navigate(q.path, { state: { from: ROUTES.ALL_MENU } });
                }}
              >
                {t(q.labelKey)}
              </span>
            ))}
          </div>

          {/* Search */}
          <div className={styles.searchBar}>
            <input
              className={styles.searchInput}
              placeholder={t('allmenu.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className={styles.searchIcon}>
              <SearchIcon size={18} />
            </span>
          </div>

          {/* Tags */}
          <div className={styles.tagRow}>
            {TAGS.map((tag) => (
              <span
                key={tag.labelKey}
                className={styles.tag}
                onClick={() => {
                  navigate(tag.path, { state: { from: ROUTES.ALL_MENU } });
                }}
              >
                {t(tag.labelKey)}
              </span>
            ))}
          </div>
        </ScreenHeader>

        {/* Search results OR menu shell */}
        {searchResults !== null ? (
          <div className={styles.searchResults}>
            {searchResults.length === 0 ? (
              <div className={styles.searchEmpty}>{t('allmenu.searchEmpty')}</div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.labelKey + item.path}
                  className={styles.menuItem}
                  onClick={() => {
                    navigate(item.path, { state: { from: ROUTES.ALL_MENU } });
                  }}
                >
                  <span>{t(item.labelKey)}</span>
                  <span className={styles.arrow}>›</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.shell}>
            {/* Left nav */}
            <div className={styles.leftNav}>
              {NAV_KEYS.map((key) => (
                <div
                  key={key}
                  className={`${styles.leftItem} ${activeNav === key ? styles.leftItemActive : ''}`}
                  onClick={() => handleSetActiveNav(key)}
                >
                  {t(`allmenu.nav.${key}`)}
                </div>
              ))}
            </div>

            {/* Right content */}
            <div ref={rightRef} className={styles.rightContent}>
              {MENU[activeNav].map((block) => (
                <div key={block.titleKey} className={styles.menuBlock}>
                  <b className={styles.blockTitle}>{t(block.titleKey)}</b>
                  {block.items.map((item) => (
                    <div
                      key={item.labelKey + item.path}
                      className={styles.menuItem}
                      onClick={() => {
                        navigate(item.path, { state: { from: ROUTES.ALL_MENU } });
                      }}
                    >
                      <span>{t(item.labelKey)}</span>
                      <span className={styles.arrow}>›</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer links */}
        <div className={styles.footer}>
          <span onClick={() => navigate(ROUTES.MYPAGE)}>{t('allmenu.footer.privacy')}</span>
          <span onClick={() => navigate(ROUTES.MYPAGE)}>{t('allmenu.footer.terms')}</span>
          <span onClick={() => startLogout()}>{t('allmenu.footer.logout')}</span>
        </div>
      </div>
    </>
  );
}
