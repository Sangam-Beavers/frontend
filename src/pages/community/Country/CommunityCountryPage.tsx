import { useState } from 'react';
import CommunityMenu from '@/components/community/CommunityMenu';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityCountryPage.module.css';

export default function CommunityCountryPage() {
  const [showSearch, setShowSearch] = useState(false);
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts({ category: 'COUNTRY' });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <>
      <TopBar title="커뮤니티" />

      <CommunityTabs active="country" />

      <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.banner}>
        <b>국가별 정보</b>
        <span>같은 나라 사람들과 생활·행정·커뮤니티 정보를 모아봐요.</span>
      </div>

      {isLoading ? (
        <div className={styles.empty}>게시글을 불러오는 중…</div>
      ) : error ? (
        <div className={styles.empty}>게시글을 불러오지 못했어요.</div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((item) => (
            <FeedPost key={item.public_id} post={toFeedPostItem(item)} />
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      ) : (
        <div className={styles.empty}>
          {keyword ? '검색 결과가 없습니다' : '등록된 게시글이 없습니다'}
        </div>
      )}
    </>
  );
}
