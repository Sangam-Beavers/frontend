import BottomNav from '@/components/BottomNav';
import CommunityTabs from '@/components/CommunityTabs';
import FeedPost from '@/components/FeedPost';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { FeedPostItem } from '@/types/community';
import styles from './CommunityLifePage.module.css';

interface QuickItem {
  id: string;
  label: string;
}

const QUICK_ITEMS: QuickItem[] = [
  { id: 'food', label: '🍜 고향의 맛' },
  { id: 'club', label: '⚽ 동호회' },
  { id: 'hospital', label: '🏥 병원 정보' },
  { id: 'mart', label: '🛒 마트 정보' },
];

const POSTS: FeedPostItem[] = [
  {
    id: 'ansan-mart',
    title: '안산 베트남 식재료 마트 추천',
    meta: '생활 · 좋아요 24',
    body: '쌀국수 재료와 향신료를 저렴하게 살 수 있어요.',
    avatarInitial: 'M',
    avatarTone: 'mid',
  },
  {
    id: 'futsal',
    title: '주말 풋살 동호회 모집',
    meta: '동호회 · 중국어/한국어 가능',
    body: '처음 오는 분도 환영합니다. 매주 일요일 오후 3시.',
    avatarInitial: 'C',
    avatarTone: 'good',
  },
];

export default function CommunityLifePage() {
  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={2} />}>
      <TopBar
        title="커뮤니티"
        rightAction={
          <button type="button" className={styles.searchIcon} aria-label="검색">
            🔍
          </button>
        }
      />

      <CommunityTabs active="life" />

      <div className={styles.banner}>
        <b>생활 게시판</b>
        <span>고향의 맛 · 동호회 · 병원/마트 · 지역 정보</span>
      </div>

      <div className={styles.quickGrid}>
        {QUICK_ITEMS.map((item) => (
          <button key={item.id} type="button" className={styles.quickCard}>
            {item.label}
          </button>
        ))}
      </div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </MobileScreen>
  );
}
