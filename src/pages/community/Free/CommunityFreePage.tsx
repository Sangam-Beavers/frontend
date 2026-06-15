import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import styles from './CommunityFreePage.module.css';

export default function CommunityFreePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts({ category: 'FREE' });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <>
      <ScreenHeader>
        <TopBar
          title={t('community.title')}
          onBack={() => (location.state?.from != null ? navigate(-1) : navigate(ROUTES.COMMUNITY))}
        />

        <CommunityTabs active="free" />

        <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
        {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}
      </ScreenHeader>

      <div className={styles.banner}>
        <b>{t('community.boards.free.title')}</b>
        <span>{t('community.boards.free.sub')}</span>
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
