import { useState } from 'react';
import CommunityMenu from '@/components/community/CommunityMenu';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { useQna } from '@/hooks/useQna';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityJobPage.module.css';

export default function CommunityJobPage() {
  const [showSearch, setShowSearch] = useState(false);

  // 주요 QnA — JOB 카테고리 답변 많은 순 Top 1 (api-spec §8).
  // 4상태 분리(로딩/에러/빈/정상) — 에러를 "빈 결과"로 오인 방지(CodeRabbit 리뷰 반영).
  const {
    data: qnaData,
    isLoading: isQnaLoading,
    error: qnaError,
  } = useQna({ category: 'JOB', size: 1 });
  const topQna = qnaData?.posts[0];

  // 취업 게시판 글 목록 (실제 API) + 게시판 내 검색 + 페이지네이션(URL 동기화).
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts({ category: 'JOB' });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <>
      <TopBar title="커뮤니티" />

      <CommunityTabs active="job" />

      <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.jobAd}>
        <b>잡코리아 연동 공고</b>
        <span>외국인 가능 · 기숙사 제공 · 비자 지원 공고를 추천해요</span>
        <button type="button" className={styles.jobAdBtn}>
          공고 보기
        </button>
      </div>

      <div className={styles.qnaCard}>
        <b>주요 QnA</b>
        {isQnaLoading && <div className={styles.qnaQuestion}>불러오는 중…</div>}
        {!isQnaLoading && qnaError && (
          <div className={styles.qnaQuestion}>
            질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}
        {!isQnaLoading && !qnaError && !topQna && (
          <div className={styles.qnaQuestion}>아직 등록된 질문이 없어요.</div>
        )}
        {topQna && (
          <>
            <div className={styles.qnaQuestion}>Q. {topQna.title}</div>
            <p className={styles.qnaMeta}>답변 {topQna.comment_count}</p>
          </>
        )}
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
