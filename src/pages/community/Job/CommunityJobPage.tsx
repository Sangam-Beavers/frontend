import { useState } from 'react';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { useDebouncedKeyword } from '@/hooks/useDebouncedKeyword';
import { useQna } from '@/hooks/useQna';
import { usePosts } from '@/hooks/usePosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityJobPage.module.css';

interface QuickItem {
  id: string;
  label: string;
}

const QUICK_ITEMS: QuickItem[] = [
  { id: 'recommend', label: '💼 일자리 추천' },
  { id: 'rating', label: '🏢 기업 평가' },
  { id: 'qna', label: '❓ 주요 QnA' },
  { id: 'interview', label: '📝 면접 후기' },
];

export default function CommunityJobPage() {
  const [showSearch, setShowSearch] = useState(false);
  const { searchQuery, setSearchQuery, keyword } = useDebouncedKeyword();

  // 주요 QnA — JOB 카테고리 답변 많은 순 Top 1 (api-spec §8).
  // 4상태 분리(로딩/에러/빈/정상) — 에러를 "빈 결과"로 오인 방지(CodeRabbit 리뷰 반영).
  const {
    data: qnaData,
    isLoading: isQnaLoading,
    error: qnaError,
  } = useQna({ category: 'JOB', size: 1 });
  const topQna = qnaData?.posts[0];

  // 취업 게시판 글 목록 (실제 API) + 게시판 내 검색.
  const { data, isLoading, error } = usePosts({ category: 'JOB', keyword: keyword || undefined });
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

      <CommunityTabs active="job" />

      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.jobAd}>
        <b>잡코리아 연동 공고</b>
        <span>외국인 가능 · 기숙사 제공 · 비자 지원 공고를 추천해요</span>
        <button type="button" className={styles.jobAdBtn}>
          공고 보기
        </button>
      </div>

      <div className={styles.quickGrid}>
        {QUICK_ITEMS.map((item) => (
          <button key={item.id} type="button" className={styles.quickCard}>
            {item.label}
          </button>
        ))}
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
    </>
  );
}
