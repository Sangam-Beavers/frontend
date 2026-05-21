import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { COMMUNITY_POSTS_FREE_MOCK } from '@/mocks/communityMock';
import styles from './CommunityFreePage.module.css';

const POSTS = COMMUNITY_POSTS_FREE_MOCK.result;

export default function CommunityFreePage() {
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

      <CommunityTabs active="free" />

      <div className={styles.banner}>
        <b>자유게시판</b>
        <span>질문, 잡담, 하루 이야기, 정보 공유를 자유롭게 남겨보세요.</span>
      </div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </>
  );
}
