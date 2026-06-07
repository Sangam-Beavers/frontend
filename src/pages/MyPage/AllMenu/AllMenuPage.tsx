import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startLogout } from '@/auth/logout';
import { LANGUAGE_CODE_TO_LABEL } from '@/constants/languages';
import { ROUTES } from '@/constants/routes';
import { useMyProfile } from '@/hooks/useMyProfile';
import { COMMUNITY_TABS } from '@/types/community';
import styles from './AllMenuPage.module.css';

const LEFT_NAV = ['전체', '금융', '문서 분석', '커뮤니티', '마이페이지', '고객센터'] as const;
type NavKey = (typeof LEFT_NAV)[number];

interface MenuItem {
  label: string;
  path: string;
}

const financialItems: MenuItem[] = [
  { label: '앱 내 송금', path: '/transfer/app' },
  { label: '타행 송금', path: '/transfer/bank' },
  { label: '정기 송금', path: '/recurring' },
  { label: '충전하기 / 인출', path: '/charge' },
  { label: '환전 / 재환전', path: '/exchange' },
  { label: '환전 내역', path: '/mypage/exchange-history' },
  { label: '송금 내역', path: '/mypage/wallet-history' },
];

const docItems: MenuItem[] = [
  { label: 'AI 문서 분석', path: '/doc-analysis' },
  { label: '문서 분석 내역', path: '/mypage/doc-analysis-history' },
];

// 카테고리는 커뮤니티 탭(COMMUNITY_TABS, SSOT)에서 파생 — 라벨/경로가 항상 탭과 일치한다.
// '전체'는 메뉴 맥락에 맞게 '커뮤니티 홈'으로 노출하고, 액션(내 관심글·글쓰기)을 덧붙인다.
const communityItems: MenuItem[] = [
  { label: '커뮤니티 홈', path: ROUTES.COMMUNITY },
  ...COMMUNITY_TABS.filter((tab) => tab.category !== 'all').map((tab) => ({
    label: tab.label,
    path: tab.path,
  })),
  { label: '내 관심글', path: ROUTES.COMMUNITY_LIKED },
  { label: '글쓰기', path: ROUTES.COMMUNITY_WRITE },
];

const mypageItems: MenuItem[] = [
  { label: '프로필 설정', path: '/mypage/profile' },
  { label: '추가 인증', path: '/mypage/badge' },
  { label: '언어 설정', path: '/mypage/language' },
  { label: '구독 관리', path: '/mypage/subscription' },
  { label: '계좌 관리', path: '/mypage/accounts' },
];

const supportItems: MenuItem[] = [
  { label: '공지사항', path: '/community' },
  { label: '자주 묻는 질문', path: '/community' },
  { label: '1:1 문의', path: '/community/write' },
];

const ALL_ITEMS: MenuItem[] = [
  ...financialItems,
  ...docItems,
  ...communityItems,
  ...mypageItems,
  ...supportItems,
];

const MENU: Record<NavKey, { title: string; items: MenuItem[] }[]> = {
  전체: [{ title: '전체 메뉴', items: ALL_ITEMS }],
  금융: [{ title: '금융', items: financialItems }],
  '문서 분석': [{ title: '문서 분석', items: docItems }],
  커뮤니티: [{ title: '커뮤니티', items: communityItems }],
  마이페이지: [{ title: '마이페이지', items: mypageItems }],
  고객센터: [{ title: '고객센터', items: supportItems }],
};

const TAGS: MenuItem[] = [
  { label: '#앱 내 송금', path: '/transfer/app' },
  { label: '#타행 송금', path: '/transfer/bank' },
  { label: '#문서분석', path: '/doc-analysis' },
  { label: '#거주증명서', path: '/doc-analysis' },
];

const QUICK_LINKS: MenuItem[] = [
  { label: '금융서비스', path: '/charge' },
  { label: '언어/번역', path: '/mypage/language' },
  { label: 'Language', path: '/mypage/language' },
];

// BCP 47 언어 코드 → 한국어 라벨(프로필 메타 표시용). 공통 constants 재사용.
// 매핑 없는 코드는 원본 코드 노출(MVP 4개 외).

export default function AllMenuPage() {
  const navigate = useNavigate();
  // 헤더 프로필 — 실제 로그인 사용자(GET /members/me). 마이페이지와 동일 소스.
  const { data: profile, isLoading } = useMyProfile();
  const nickname = profile?.nickname ?? '';
  const avatarInitial = nickname.charAt(0).toUpperCase() || '?';
  const languageLabel = profile?.language
    ? (LANGUAGE_CODE_TO_LABEL[profile.language] ?? profile.language)
    : '';
  const [activeNav, setActiveNav] = useState<NavKey>('전체');
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return ALL_ITEMS.filter((item) => item.label.toLowerCase().includes(q));
  }, [searchQuery]);

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
                {isLoading ? '불러오는 중…' : nickname || '사용자'}
                {profile?.is_verified && <span className={styles.badge}>인증</span>}
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
            <span key={q.label} onClick={() => navigate(q.path)}>
              {q.label}
            </span>
          ))}
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <input
            className={styles.searchInput}
            placeholder="메뉴를 검색해보세요."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className={styles.searchIcon}>🔍</span>
        </div>

        {/* Tags */}
        <div className={styles.tagRow}>
          {TAGS.map((tag) => (
            <span key={tag.label} className={styles.tag} onClick={() => navigate(tag.path)}>
              {tag.label}
            </span>
          ))}
        </div>

        {/* Search results OR menu shell */}
        {searchResults !== null ? (
          <div className={styles.searchResults}>
            {searchResults.length === 0 ? (
              <div className={styles.searchEmpty}>검색 결과가 없습니다.</div>
            ) : (
              searchResults.map((item) => (
                <div
                  key={item.label + item.path}
                  className={styles.menuItem}
                  onClick={() => navigate(item.path)}
                >
                  <span>{item.label}</span>
                  <span className={styles.arrow}>›</span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className={styles.shell}>
            {/* Left nav */}
            <div className={styles.leftNav}>
              {LEFT_NAV.map((item) => (
                <div
                  key={item}
                  className={`${styles.leftItem} ${activeNav === item ? styles.leftItemActive : ''}`}
                  onClick={() => setActiveNav(item)}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Right content */}
            <div className={styles.rightContent}>
              {MENU[activeNav].map((block) => (
                <div key={block.title} className={styles.menuBlock}>
                  <b className={styles.blockTitle}>{block.title}</b>
                  {block.items.map((item) => (
                    <div
                      key={item.label}
                      className={styles.menuItem}
                      onClick={() => navigate(item.path)}
                    >
                      <span>{item.label}</span>
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
          <span onClick={() => navigate('/mypage')}>개인정보</span>
          <span onClick={() => navigate('/mypage')}>이용약관</span>
          <span onClick={() => startLogout()}>로그아웃</span>
        </div>
      </div>
    </>
  );
}
