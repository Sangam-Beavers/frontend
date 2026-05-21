import { useNavigate } from 'react-router-dom';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { COMMUNITY_POSTS_ALL_MOCK } from '@/mocks/communityMock';
import styles from './CommunityPage.module.css';

const POSTS = COMMUNITY_POSTS_ALL_MOCK.result;

export default function CommunityPage() {
  const navigate = useNavigate();
  return (
    <>
      <TopBar
        title="커뮤니티"
        showBack={false}
        rightAction={
          <button type="button" className={styles.searchIcon} aria-label="검색">
            🔍
          </button>
        }
      />

      <CommunityTabs active="all" />

      <div className={styles.search}>궁금한 생활 정보, 일자리, 거주 후기를 검색해보세요</div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.primary}`}
          onClick={() => navigate('/community/write')}
        >
          글쓰기
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.ghost}`}
          onClick={() => navigate('/mypage')}
        >
          내 관심글
        </button>
      </div>

      <div className={styles.section}>전체 게시글</div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </>
  );
}
