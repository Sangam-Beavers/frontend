import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { startLogout } from '@/auth/logout';
import { LANGUAGE_CODE_TO_LABEL } from '@/constants/languages';
import { ROUTES } from '@/constants/routes';
import { useMyProfile } from '@/hooks/useMyProfile';
import styles from './AllMenuPage.module.css';

const NAV_KEYS = ['all', 'finance', 'documents', 'community', 'mypage', 'support'] as const;
type NavKey = (typeof NAV_KEYS)[number];

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

// 커뮤니티 카테고리는 community.categories.* 키 재사용 (COMMUNITY_TABS과 의미 동일)
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
  { labelKey: 'allmenu.items.notices', path: '/community' },
  { labelKey: 'allmenu.items.faq', path: '/community' },
  { labelKey: 'allmenu.items.contact', path: '/community/write' },
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
  { labelKey: 'allmenu.quickLinks.finance', path: '/charge' },
  { labelKey: 'allmenu.quickLinks.languageTranslate', path: '/mypage/language' },
  { labelKey: 'allmenu.quickLinks.language', path: '/mypage/language' },
];

export default function AllMenuPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  // 헤더 프로필 — 실제 로그인 사용자(GET /members/me). 마이페이지와 동일 소스.
  const { data: profile, isLoading } = useMyProfile();
  const nickname = profile?.nickname ?? '';
  const avatarInitial = nickname.charAt(0).toUpperCase() || '?';
  const languageLabel = profile?.language
    ? (LANGUAGE_CODE_TO_LABEL[profile.language] ?? profile.language)
    : '';
  const [activeNav, setActiveNav] = useState<NavKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return ALL_ITEMS.filter((item) => t(item.labelKey).toLowerCase().includes(q));
  }, [searchQuery, t]);

  return (
    <>
      <div className={styles.flexColumn}>
        {/* Profile header */}
        <div className={styles.head}>
          <div
            className={styles.profileRow}
            onClick={() => navigate('/mypage')}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.avatar}>{avatarInitial}</div>
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
            <span onClick={() => navigate('/mypage')} style={{ cursor: 'pointer' }}>
              ⚙️
            </span>
          </div>
        </div>

        {/* Quick access */}
        <div className={styles.quickGrid}>
          {QUICK_LINKS.map((q) => (
            <span key={q.labelKey} onClick={() => navigate(q.path)}>
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
          <span className={styles.searchIcon}>🔍</span>
        </div>

        {/* Tags */}
        <div className={styles.tagRow}>
          {TAGS.map((tag) => (
            <span key={tag.labelKey} className={styles.tag} onClick={() => navigate(tag.path)}>
              {t(tag.labelKey)}
            </span>
          ))}
        </div>

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
                  onClick={() => navigate(item.path)}
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
                  onClick={() => setActiveNav(key)}
                >
                  {t(`allmenu.nav.${key}`)}
                </div>
              ))}
            </div>

            {/* Right content */}
            <div className={styles.rightContent}>
              {MENU[activeNav].map((block) => (
                <div key={block.titleKey} className={styles.menuBlock}>
                  <b className={styles.blockTitle}>{t(block.titleKey)}</b>
                  {block.items.map((item) => (
                    <div
                      key={item.labelKey + item.path}
                      className={styles.menuItem}
                      onClick={() => navigate(item.path)}
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
          <span onClick={() => navigate('/mypage')}>{t('allmenu.footer.privacy')}</span>
          <span onClick={() => navigate('/mypage')}>{t('allmenu.footer.terms')}</span>
          <span onClick={() => startLogout()}>{t('allmenu.footer.logout')}</span>
        </div>
      </div>
    </>
  );
}
