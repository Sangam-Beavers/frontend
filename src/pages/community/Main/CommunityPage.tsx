import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CommunityMenu from '@/components/community/CommunityMenu';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import ScreenHeader from '@/components/layout/ScreenHeader';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import { ROUTES } from '@/constants/routes';
import styles from './CommunityPage.module.css';

export default function CommunityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  // 전체 탭 → category 미지정. 페이지·검색 상태는 URL(?page=&keyword=)로 관리(뒤로 가기 복원).
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts();
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <>
      <ScreenHeader>
        <TopBar
          title={t('community.title')}
          showBack={false}
          rightAction={<div style={{ width: 40 }} />}
        />

        <CommunityTabs active="all" />

        <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
        {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}
      </ScreenHeader>

      {/* FAQ 빠른 진입 */}
      <button
        type="button"
        className={styles.faqBanner}
        onClick={() => navigate(ROUTES.COMMUNITY_FAQ)}
      >
        <span className={styles.faqIcon}>💬</span>
        <span className={styles.faqLabel}>자주 묻는 질문 (FAQ)</span>
        <span className={styles.faqArrow}>›</span>
      </button>

      <div className={styles.section}>{t('community.allPosts')}</div>

      {isLoading ? (
        <div className={styles.empty}>{t('community.loading')}</div>
      ) : error ? (
        <div className={styles.empty}>{t('community.loadError')}</div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((item) => (
            <FeedPost key={item.public_id} post={toFeedPostItem(item)} />
          ))}
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      ) : (
        <div className={styles.empty}>
          {keyword ? t('community.emptySearch') : t('community.empty')}
        </div>
      )}
    </>
  );
}
