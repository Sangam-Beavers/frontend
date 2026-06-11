import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CommunityMenu from '@/components/community/CommunityMenu';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import { ROUTES } from '@/constants/routes';
import styles from './CommunityLifePage.module.css';

export default function CommunityLifePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts({ category: 'LIFE_INFO' });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <>
      <TopBar
        title={t('community.title')}
        onBack={() => navigate(location.state?.from ?? ROUTES.COMMUNITY)}
      />

      <CommunityTabs active="life" />

      <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

      <div className={styles.banner}>
        <b>{t('community.boards.life.title')}</b>
        <span>{t('community.boards.life.sub')}</span>
      </div>

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
