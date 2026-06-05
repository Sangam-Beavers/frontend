import { useNavigate } from 'react-router-dom';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityPage.module.css';

export default function CommunityPage() {
  const navigate = useNavigate();
  // 전체 탭 → category 미지정. 페이지·검색 상태는 URL(?page=&keyword=)로 관리(뒤로 가기 복원).
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts();
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

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
