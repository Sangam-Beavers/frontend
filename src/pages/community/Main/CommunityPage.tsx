import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { COMMUNITY_POSTS_ALL_MOCK } from '@/mocks/communityMock';
import styles from './CommunityPage.module.css';

const POSTS = COMMUNITY_POSTS_ALL_MOCK.result;

export default function CommunityPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPosts = searchQuery.trim()
    ? POSTS.filter((p) => p.title.includes(searchQuery) || (p.preview ?? '').includes(searchQuery))
    : POSTS;

  return (
    <>
      <TopBar title="커뮤니티" showBack={false} rightAction={<div style={{ width: 40 }} />} />

      <CommunityTabs active="all" />

      <input
        className={styles.search}
        placeholder="궁금한 생활 정보, 일자리, 거주 후기를 검색해보세요"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.primary}`}
          onClick={() => navigate('/community/write')}
        >
          글쓰기
        </button>
        <button type="button" className={`${styles.actionBtn} ${styles.ghost}`}>
          내 관심글
        </button>
      </div>

      <div className={styles.section}>전체 게시글</div>

      {filteredPosts.length > 0 ? (
        filteredPosts.map((post) => <FeedPost key={post.id} post={post} />)
      ) : (
        <div className={styles.empty}>검색 결과가 없습니다</div>
      )}
    </>
  );
}
