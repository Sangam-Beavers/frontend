import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import styles from './AllMenuPage.module.css';

const LEFT_NAV = ['금융', '문서 분석', '커뮤니티', '마이페이지', '고객센터'] as const;
type NavKey = (typeof LEFT_NAV)[number];

const MENU: Record<NavKey, { title: string; items: string[] }[]> = {
  금융: [
    {
      title: '금융',
      items: [
        '앱 내 송금',
        '타행 송금',
        '정기 송금',
        '충전하기 / 인출',
        '환전 / 재환전',
        '자동이체 설정',
        '환전 내역',
        '송금 내역',
      ],
    },
    {
      title: '문서 분석',
      items: ['AI 문서 분석', '문서 분석 내역', '결제 내역'],
    },
    {
      title: '마이페이지',
      items: ['프로필 설정', '보안 설정', '알림 설정', '언어 설정', '구독 관리'],
    },
  ],
  '문서 분석': [{ title: '문서 분석', items: ['AI 문서 분석', '문서 분석 내역', '결제 내역'] }],
  커뮤니티: [{ title: '커뮤니티', items: ['커뮤니티 홈', '내 게시물', '즐겨찾기'] }],
  마이페이지: [
    {
      title: '마이페이지',
      items: ['프로필 설정', '보안 설정', '알림 설정', '언어 설정', '구독 관리'],
    },
  ],
  고객센터: [{ title: '고객센터', items: ['공지사항', '자주 묻는 질문', '1:1 문의'] }],
};

const TAGS = ['#앱 내 송금', '#타행 송금', '#문서분석', '#거주증명서'];

export default function AllMenuPage() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<NavKey>('금융');

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Profile header */}
        <div className={styles.head}>
          <div className={styles.profileRow}>
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
            <span>🔔</span>
            <span>⚙️</span>
          </div>
        </div>

        {/* Quick access */}
        <div className={styles.quickGrid}>
          <span>금융서비스</span>
          <span>언어/번역</span>
          <span>Language</span>
        </div>

        {/* Search */}
        <div className={styles.searchBar}>
          <span className={styles.searchPlaceholder}>메뉴를 검색해보세요.</span>
          <span className={styles.searchIcon}>🔍</span>
        </div>

        {/* Tags */}
        <div className={styles.tagRow}>
          {TAGS.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
            </span>
          ))}
        </div>

        {/* Menu shell */}
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
                  <div key={item} className={styles.menuItem}>
                    <span>{item}</span>
                    <span className={styles.arrow}>›</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className={styles.footer}>
          <span>개인정보</span>
          <span>이용약관</span>
          <span onClick={() => navigate('/login')}>로그아웃</span>
        </div>
      </div>

      <BottomNav activeIndex={3} />
    </div>
  );
}
