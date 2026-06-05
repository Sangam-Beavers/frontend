import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startLogout } from '@/auth/logout';
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

const communityItems: MenuItem[] = [
  { label: '커뮤니티 홈', path: '/community' },
  { label: '거주', path: '/community/residence' },
  { label: '생활 정보', path: '/community/life' },
  { label: '구인구직', path: '/community/job' },
  { label: '자유 게시판', path: '/community/free' },
  { label: '글쓰기', path: '/community/write' },
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

export default function AllMenuPage() {
  const navigate = useNavigate();
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
            <div className={styles.avatar}>G</div>
            <div>
              <div className={styles.username}>
                global_bridge_neighbor
                <span className={styles.badge}>프리미엄</span>
              </div>
              <div className={styles.userMeta}>베트남어 · Tiếng Việt</div>
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
