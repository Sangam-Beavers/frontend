import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CommunityMenu from '@/components/community/CommunityMenu';
import CommunitySearchBar from '@/components/community/CommunitySearchBar';
import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { usePagedPosts } from '@/hooks/usePagedPosts';
import { toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityFreePage.module.css';

export default function CommunityFreePage() {
  const { t } = useTranslation();
  const [showSearch, setShowSearch] = useState(false);
  const { data, isLoading, error, page, goToPage, searchQuery, setSearchQuery, keyword } =
    usePagedPosts({ category: 'FREE' });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  return (
    <>
      <TopBar title={t('community.title')} />

      <CommunityTabs active="free" />

      <CommunityMenu onToggleSearch={() => setShowSearch((s) => !s)} searchActive={showSearch} />
      {showSearch && <CommunitySearchBar value={searchQuery} onChange={setSearchQuery} />}

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
