import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FeedPost from '@/components/community/FeedPost';
import Pagination from '@/components/community/Pagination';
import TopBar from '@/components/navigation/TopBar';
import { useLikedPosts } from '@/hooks/useLikedPosts';
import { formatRelativeTime, toFeedPostItem } from '@/utils/communityFeed';
import styles from './CommunityLikedPage.module.css';

/**
 * 내 관심글 — 요청자가 좋아요한 게시글 목록. 커뮤니티 메뉴의 '내 관심글'에서 진입한다.
 *
 * <p>페이지 상태는 URL(?page=)로 관리해 게시글 상세에 다녀와도 보던 페이지가 복원된다(목록과 동일 정책).
 * 인증 필요 — 비로그인은 조회 시 401 → 로그인으로 이동(client 인터셉터).
 */
export default function CommunityLikedPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  // URL은 1-index(사람 친화), 내부/백엔드는 0-index.
  const rawPage = Number(searchParams.get('page'));
  const page = Number.isInteger(rawPage) && rawPage > 1 ? rawPage - 1 : 0;

  const { data, isLoading, error } = useLikedPosts({ page });
  const posts = data?.posts ?? [];
  const totalPages = data?.total_pages ?? 0;

  const goToPage = (next: number) => {
    setSearchParams(
      (prev) => {
        const updated = new URLSearchParams(prev);
        if (next <= 0) updated.delete('page');
        else updated.set('page', String(next + 1)); // 0-index → URL 1-index
        return updated;
      },
      { replace: true }
    );
    // 실제 스크롤 컨테이너는 MobileScreen의 .content(window가 아님).
    document
      .querySelector<HTMLElement>('[data-scroll-root]')
      ?.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <>
      <TopBar title={t('community.likedPage.title')} />

      {isLoading ? (
        <div className={styles.empty}>{t('community.likedPage.loading')}</div>
      ) : error ? (
        <div className={styles.empty}>{t('community.likedPage.loadError')}</div>
      ) : posts.length > 0 ? (
        <>
          {posts.map((item) => {
            // 내 관심글 맥락 — 기본 메타에 "좋아요한 시점"을 짧게 덧붙인다.
            const card = toFeedPostItem(item);
            return (
              <FeedPost
                key={item.public_id}
                post={{ ...card, meta: `${card.meta} · ♥ ${formatRelativeTime(item.liked_at)}` }}
              />
            );
          })}
          <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
        </>
      ) : page > 0 ? (
        // 빈 페이지인데 첫 페이지가 아님 — 좋아요 취소/삭제로 페이지가 줄었거나 직접 URL 진입.
        // 막다른 빈 화면 대신 처음으로 돌아갈 수단을 준다.
        <div className={styles.empty}>
          {t('community.likedPage.emptyPage')}
          <button type="button" className={styles.backFirst} onClick={() => goToPage(0)}>
            {t('community.likedPage.backToFirst')}
          </button>
        </div>
      ) : (
        <div className={styles.empty}>{t('community.likedPage.empty')}</div>
      )}
    </>
  );
}
