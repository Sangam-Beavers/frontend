import { useSearchParams } from 'react-router-dom';
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
      <TopBar title="내 관심글" />

      {isLoading ? (
        <div className={styles.empty}>관심글을 불러오는 중…</div>
      ) : error ? (
        <div className={styles.empty}>관심글을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</div>
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
          이 페이지에는 관심글이 없어요.
          <button type="button" className={styles.backFirst} onClick={() => goToPage(0)}>
            처음으로
          </button>
        </div>
      ) : (
        <div className={styles.empty}>아직 관심글이 없어요. 마음에 드는 글에 ♥를 눌러보세요.</div>
      )}
    </>
  );
}
