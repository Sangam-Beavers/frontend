import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { usePosts } from '@/hooks/usePosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityPage.module.css';

export default function CommunityPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // 검색어 디바운스(300ms) — 매 타이핑마다 요청하지 않도록 keyword를 늦춰서 반영.
  const [keyword, setKeyword] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setKeyword(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 전체 탭 → category 미지정. 검색은 서버(keyword)로.
  const { data, isLoading, error } = usePosts({ keyword: keyword || undefined });
  const posts = data?.posts ?? [];

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

      {isLoading ? (
        <div className={styles.empty}>게시글을 불러오는 중…</div>
      ) : error ? (
        <div className={styles.empty}>게시글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
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
