import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { usePosts } from '@/hooks/usePosts';
import { toFeedPostItem } from '@/utils/communityFeed';
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

export default function CommunityLifePage() {
  const { data, isLoading, error } = usePosts({ category: 'LIFE_INFO' });
  const posts = data?.posts ?? [];

  return (
    <>
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

      {isLoading ? (
        <div className={styles.empty}>게시글을 불러오는 중…</div>
      ) : error ? (
        <div className={styles.empty}>게시글을 불러오지 못했어요.</div>
      ) : posts.length > 0 ? (
        posts.map((item) => <FeedPost key={item.public_id} post={toFeedPostItem(item)} />)
      ) : (
        <div className={styles.empty}>등록된 게시글이 없습니다</div>
      )}
    </>
  );
}
