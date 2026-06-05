import { useState } from 'react';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { useDebouncedKeyword } from '@/hooks/useDebouncedKeyword';
import { usePosts } from '@/hooks/usePosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityVisaPage.module.css';

export default function CommunityVisaPage() {
  const [showSearch, setShowSearch] = useState(false);
  const { searchQuery, setSearchQuery, keyword } = useDebouncedKeyword();
  const { data, isLoading, error } = usePosts({ category: 'VISA', keyword: keyword || undefined });
  const posts = data?.posts ?? [];

  return (
    <>
      <TopBar
        title="커뮤니티"
        rightAction={
          <button
            type="button"
            className={styles.searchIcon}
            aria-label="검색"
            aria-pressed={showSearch}
            onClick={() => setShowSearch((s) => !s)}
          >
            🔍
          </button>
        }
      />

      <CommunityTabs active="visa" />

      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.banner}>
        <b>비자 게시판</b>
        <span>비자 발급·연장·변경, 체류 자격 관련 정보를 나눠요.</span>
      </div>

      {isLoading ? (
        <div className={styles.empty}>게시글을 불러오는 중…</div>
      ) : error ? (
        <div className={styles.empty}>게시글을 불러오지 못했어요.</div>
      ) : posts.length > 0 ? (
        posts.map((item) => <FeedPost key={item.public_id} post={toFeedPostItem(item)} />)
      ) : (
        <div className={styles.empty}>
          {keyword ? '검색 결과가 없습니다' : '등록된 게시글이 없습니다'}
        </div>
      )}
    </>
  );
}
