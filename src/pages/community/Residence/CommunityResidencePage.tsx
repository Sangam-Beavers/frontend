import { useState } from 'react';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityResidencePage.module.css';

interface TemperatureChip {
  label: string;
  toneClass: string;
}

const TEMPERATURES: TemperatureChip[] = [
  { label: '주의', toneClass: styles.tempRed },
  { label: '보통 이하', toneClass: styles.tempYellow },
  { label: '보통', toneClass: styles.tempGreen },
  { label: '좋음', toneClass: styles.tempPurple },
  { label: '매우 좋음', toneClass: styles.tempBlue },
];

export default function CommunityResidencePage() {
  const [showSearch, setShowSearch] = useState(false);
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts({ category: 'RESIDENCE' });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

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

      <CommunityTabs active="residence" />

      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.banner}>
        <b>거주 게시판</b>
        <span>부동산 · 급매 · 룸메 구하기 · 생활온도</span>
      </div>

      <div className={styles.tempStrip}>
        {TEMPERATURES.map((chip) => (
          <span key={chip.label} className={`${styles.temp} ${chip.toneClass}`}>
            {chip.label}
          </span>
        ))}
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
