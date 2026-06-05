import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { usePosts } from '@/hooks/usePosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityCountryPage.module.css';

export default function CommunityCountryPage() {
  const { data, isLoading, error } = usePosts({ category: 'COUNTRY' });
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

      <CommunityTabs active="country" />

      <div className={styles.banner}>
        <b>국가별 정보</b>
        <span>같은 나라 사람들과 생활·행정·커뮤니티 정보를 모아봐요.</span>
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
