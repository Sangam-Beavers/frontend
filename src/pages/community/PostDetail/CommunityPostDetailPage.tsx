import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiException } from '@/api';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TopBar from '@/components/navigation/TopBar';
import { buildCommunityPostEditPath } from '@/constants/routes';
import { useComments } from '@/hooks/useComments';
import { useCreateComment } from '@/hooks/useCreateComment';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { useDeletePost } from '@/hooks/useDeletePost';
import { usePostDetail } from '@/hooks/usePostDetail';
import { useToggleLike } from '@/hooks/useToggleLike';
import { categoryLabel, formatCommunityDate } from '@/utils/communityFeed';
import { communityErrorMessage } from '@/utils/communityErrorMessage';
import styles from './CommunityPostDetailPage.module.css';

export default function CommunityPostDetailPage() {
  const navigate = useNavigate();
  const { postId = '' } = useParams<{ postId: string }>();
  const [draft, setDraft] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  // 삭제 확인 중인 댓글 public_id(오삭제 방지용 인라인 확인).
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);

  const { data: post, isLoading, error } = usePostDetail(postId);
  const {
    data: commentsData,
    isLoading: isCommentsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useComments(postId);
  const comments = commentsData?.pages.flatMap((page) => page.comments) ?? [];
  const totalComments = commentsData?.pages[0]?.total_elements ?? comments.length;
  const del = useDeletePost();
  const createComment = useCreateComment(postId);
  const deleteComment = useDeleteComment(postId);
  const toggleLike = useToggleLike(postId);
  // 좋아요 로컬 상태 — 토글 응답(liked/like_count)으로 갱신. null이면 서버 상세 값 사용.
  const [likeState, setLikeState] = useState<{ liked: boolean; like_count: number } | null>(null);
  // 좋아요 토글 실패 안내(409 제외) — null이면 숨김.
  const [likeError, setLikeError] = useState<string | null>(null);

  const handleSubmitComment = () => {
    const submitted = draft;
    const content = submitted.trim();
    if (content === '' || createComment.isPending) return;
    createComment.mutate(
      { content },
      {
        // 전송 후 사용자가 새로 입력한 내용은 보존 — 전송 시점 입력 그대로일 때만 비운다.
        onSuccess: () => setDraft((current) => (current === submitted ? '' : current)),
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (deleteComment.isPending) return;
    deleteComment.mutate(commentId, { onSuccess: () => setConfirmCommentId(null) });
  };

  // 무한 스크롤 — 목록 끝 센티넬이 뷰포트에 들어오면 다음 페이지를 이어 붙인다.
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: '160px' }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleDelete = () => {
    del.mutate(postId, { onSuccess: () => navigate('/community') });
  };

  if (isLoading) {
    return (
      <>
        <TopBar title="게시글" />
        <div className={styles.stateMsg}>게시글을 불러오는 중…</div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <TopBar title="게시글" />
        <div className={styles.stateMsg}>
          게시글을 불러오지 못했어요. 삭제되었거나 잘못된 주소일 수 있어요.
        </div>
      </>
    );
  }

  // 로컬 토글 상태 우선, 없으면 서버 상세 값(is_liked는 백엔드 미제공 시 undefined→false).
  const liked = likeState?.liked ?? post.is_liked ?? false;
  const likeCount = likeState?.like_count ?? post.like_count;

  const handleToggleLike = () => {
    if (toggleLike.isPending) return;
    setLikeError(null); // 재시도 시 이전 에러 제거
    toggleLike.mutate(!liked, {
      onSuccess: (res) => setLikeState({ liked: res.liked, like_count: res.like_count }),
      onError: (err) => {
        // 이미 좋아요한 글(409 COMMON4091) → 좋아요 상태로 보정(에러 아님). 카운트는 상세 재조회로 갱신.
        if (err instanceof ApiException && err.code === 'COMMON4091') {
          setLikeState((prev) => ({
            liked: true,
            like_count: prev?.like_count ?? post.like_count,
          }));
          return;
        }
        // 그 외(네트워크·삭제된 글 등) — 조용히 넘기지 않고 안내한다.
        setLikeError(communityErrorMessage(err));
      },
    });
  };

  return (
    <>
      <TopBar title="게시글" />

      <div className={styles.authorCard}>
        <div className={styles.authorRow}>
          <div className={`${styles.avatar} ${styles.avatarBest}`}>
            {post.author_nickname.charAt(0) || '?'}
          </div>
          <div className={styles.authorMain}>
            <div className={styles.authorName}>
              {post.author_nickname}
              {post.author_is_verified && <span className={styles.verifiedPill}>인증</span>}
            </div>
            <div className={styles.authorMeta}>
              {categoryLabel(post.category)} · {formatCommunityDate(post.created_at)}
            </div>
          </div>
        </div>
      </div>

      <h2 className={styles.title}>{post.title}</h2>
      <p className={styles.body}>{post.content}</p>

      <div className={styles.btnRow}>
        <button type="button" className={styles.secondary}>
          번역 보기
        </button>
        <button
          type="button"
          className={`${styles.secondary} ${liked ? styles.likeActive : ''}`}
          aria-pressed={liked}
          disabled={toggleLike.isPending}
          onClick={handleToggleLike}
        >
          {liked ? '♥' : '♡'} 좋아요 {likeCount}
        </button>
      </div>

      {likeError && <div className={styles.likeError}>{likeError}</div>}

      {/* 작성자에게만 노출 — is_author 기준(백엔드도 403으로 재검증). */}
      {post.is_author && (
        <div className={styles.authorActions}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => navigate(buildCommunityPostEditPath(postId))}
          >
            수정
          </button>
          <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
            삭제
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="게시글 삭제"
          message="이 글을 삭제하시겠습니까? 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          loading={del.isPending}
          error={del.error ? communityErrorMessage(del.error) : undefined}
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirmDelete(false);
            del.reset();
          }}
        />
      )}

      <div className={styles.section}>
        <span>댓글 {totalComments}</span>
      </div>

      {isCommentsLoading ? (
        <div className={styles.commentEmpty}>댓글을 불러오는 중…</div>
      ) : comments.length === 0 ? (
        <div className={styles.commentEmpty}>아직 댓글이 없어요. 첫 댓글을 남겨보세요.</div>
      ) : (
        comments.map((comment) => (
          <div key={comment.public_id} className={styles.comment}>
            <div className={styles.commentAvatar}>{comment.author_nickname.charAt(0) || '?'}</div>
            <div className={styles.commentBody}>
              <div className={styles.commentName}>
                {comment.author_nickname}
                {comment.author_is_verified && <span className={styles.verifiedPill}>인증</span>}
              </div>
              <div className={styles.commentText}>{comment.content}</div>
              <div className={styles.commentMeta}>
                <span>{formatCommunityDate(comment.created_at)}</span>
                {comment.is_author && (
                  <button
                    type="button"
                    className={styles.commentDelete}
                    onClick={() => setConfirmCommentId(comment.public_id)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      {/* 무한 스크롤 센티넬 + 다음 페이지 로딩 표시 */}
      <div ref={loadMoreRef} className={styles.loadMore}>
        {isFetchingNextPage ? '댓글 더 불러오는 중…' : ''}
      </div>

      {/* 고정된 댓글 입력 바에 마지막 댓글이 가리지 않도록 여백 확보 */}
      <div className={styles.commentListEnd} aria-hidden="true" />

      <div className={styles.commentInputBar}>
        {createComment.error && (
          <div className={styles.commentError}>{communityErrorMessage(createComment.error)}</div>
        )}
        <div className={styles.commentInputRow}>
          <input
            type="text"
            className={styles.commentInput}
            placeholder="댓글을 입력하세요"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // 한글 IME 조합 중 Enter는 제출하지 않는다(조합 확정용).
              if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                handleSubmitComment();
              }
            }}
          />
          <button
            type="button"
            className={styles.commentSubmit}
            disabled={draft.trim() === '' || createComment.isPending}
            onClick={handleSubmitComment}
          >
            {createComment.isPending ? '등록 중…' : '등록'}
          </button>
        </div>
      </div>

      {confirmCommentId && (
        <ConfirmDialog
          title="댓글 삭제"
          message="이 댓글을 삭제할까요? 되돌릴 수 없어요."
          confirmLabel="삭제"
          danger
          loading={deleteComment.isPending}
          error={deleteComment.error ? communityErrorMessage(deleteComment.error) : undefined}
          onConfirm={() => handleDeleteComment(confirmCommentId)}
          onCancel={() => {
            setConfirmCommentId(null);
            deleteComment.reset();
          }}
        />
      )}
    </>
  );
}
