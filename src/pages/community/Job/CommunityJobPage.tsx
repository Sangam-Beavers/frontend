import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      <TopBar title={t('community.job.title')} />

      <CommunityTabs active="job" />

      <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.jobAd}>
        <b>{t('community.job.adTitle')}</b>
        <span>{t('community.job.adDescription')}</span>
        <button type="button" className={styles.jobAdBtn}>
          {t('community.job.adButton')}
        </button>
      </div>

      <div className={styles.qnaCard}>
        <b>{t('community.job.qnaTitle')}</b>
        {isQnaLoading && <div className={styles.qnaQuestion}>{t('community.job.qnaLoading')}</div>}
        {!isQnaLoading && qnaError && (
          <div className={styles.qnaQuestion}>{t('community.job.qnaLoadError')}</div>
        )}
        {!isQnaLoading && !qnaError && !topQna && (
          <div className={styles.qnaQuestion}>{t('community.job.qnaEmpty')}</div>
        )}
        {topQna && (
          <>
            <div className={styles.qnaQuestion}>Q. {topQna.title}</div>
            <p className={styles.qnaMeta}>
              {t('community.job.answers', { count: topQna.comment_count })}
            </p>
          </>
        )}
      </div>

      {isLoading ? (
        <div className={styles.empty}>{t('community.job.loading')}</div>
      ) : error ? (
        <div className={styles.empty}>{t('community.job.loadError')}</div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((item) => (
            <FeedPost key={item.public_id} post={toFeedPostItem(item)} />
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      ) : (
        <div className={styles.empty}>
          {keyword ? t('community.job.emptySearch') : t('community.job.empty')}
        </div>
      )}
    </>
  );
}
