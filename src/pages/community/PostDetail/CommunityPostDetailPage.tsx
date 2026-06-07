import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { postId = '' } = useParams<{ postId: string }>();
  const [draft, setDraft] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
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
  const [likeState, setLikeState] = useState<{ liked: boolean; like_count: number } | null>(null);
  const [likeError, setLikeError] = useState<string | null>(null);

  const handleSubmitComment = () => {
    const submitted = draft;
    const content = submitted.trim();
    if (content === '' || createComment.isPending) return;
    createComment.mutate(
      { content },
      {
        onSuccess: () => setDraft((current) => (current === submitted ? '' : current)),
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (deleteComment.isPending) return;
    deleteComment.mutate(commentId, { onSuccess: () => setConfirmCommentId(null) });
  };

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
        <TopBar title={t('community.postDetail.topbarTitle')} />
        <div className={styles.stateMsg}>{t('community.postDetail.loading')}</div>
      </>
    );
  }

  if (error || !post) {
    return (
      <>
        <TopBar title={t('community.postDetail.topbarTitle')} />
        <div className={styles.stateMsg}>{t('community.postDetail.loadError')}</div>
      </>
    );
  }

  const liked = likeState?.liked ?? post.is_liked ?? false;
  const likeCount = likeState?.like_count ?? post.like_count;

  const handleToggleLike = () => {
    if (toggleLike.isPending) return;
    setLikeError(null);
    toggleLike.mutate(!liked, {
      onSuccess: (res) => setLikeState({ liked: res.liked, like_count: res.like_count }),
      onError: (err) => {
        if (err instanceof ApiException && err.code === 'COMMON4091') {
          setLikeState((prev) => ({
            liked: true,
            like_count: prev?.like_count ?? post.like_count,
          }));
          return;
        }
        setLikeError(communityErrorMessage(err));
      },
    });
  };

  return (
    <>
      <TopBar title={t('community.postDetail.topbarTitle')} />

      <div className={styles.authorCard}>
        <div className={styles.authorRow}>
          <div className={`${styles.avatar} ${styles.avatarBest}`}>
            {post.author_nickname.charAt(0) || '?'}
          </div>
          <div className={styles.authorMain}>
            <div className={styles.authorName}>
              {post.author_nickname}
              {post.author_is_verified && (
                <span className={styles.verifiedPill}>{t('mypage.verifiedBadge')}</span>
              )}
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
          {t('community.postDetail.translate')}
        </button>
        <button
          type="button"
          className={`${styles.secondary} ${liked ? styles.likeActive : ''}`}
          aria-pressed={liked}
          disabled={toggleLike.isPending}
          onClick={handleToggleLike}
        >
          {liked ? '♥' : '♡'} {t('community.postDetail.like')} {likeCount}
        </button>
      </div>

      {likeError && <div className={styles.likeError}>{likeError}</div>}

      {post.is_author && (
        <div className={styles.authorActions}>
          <button
            type="button"
            className={styles.editBtn}
            onClick={() => navigate(buildCommunityPostEditPath(postId))}
          >
            {t('community.postDetail.edit')}
          </button>
          <button type="button" className={styles.deleteBtn} onClick={() => setConfirmDelete(true)}>
            {t('community.postDetail.delete')}
          </button>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog
          title={t('community.postDetail.deleteTitle')}
          message={t('community.postDetail.deleteMessage')}
          confirmLabel={t('community.postDetail.delete')}
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
        <span>
          {t('community.postDetail.commentSection')} {totalComments}
        </span>
      </div>

      {isCommentsLoading ? (
        <div className={styles.commentEmpty}>{t('community.postDetail.commentLoading')}</div>
      ) : comments.length === 0 ? (
        <div className={styles.commentEmpty}>{t('community.postDetail.commentEmpty')}</div>
      ) : (
        comments.map((comment) => (
          <div key={comment.public_id} className={styles.comment}>
            <div className={styles.commentAvatar}>{comment.author_nickname.charAt(0) || '?'}</div>
            <div className={styles.commentBody}>
              <div className={styles.commentName}>
                {comment.author_nickname}
                {comment.author_is_verified && (
                  <span className={styles.verifiedPill}>{t('mypage.verifiedBadge')}</span>
                )}
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
                    {t('community.postDetail.commentDelete')}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}

      <div ref={loadMoreRef} className={styles.loadMore}>
        {isFetchingNextPage ? t('community.postDetail.commentLoadMore') : ''}
      </div>

      <div className={styles.commentListEnd} aria-hidden="true" />

      <div className={styles.commentInputBar}>
        {createComment.error && (
          <div className={styles.commentError}>{communityErrorMessage(createComment.error)}</div>
        )}
        <div className={styles.commentInputRow}>
          <input
            type="text"
            className={styles.commentInput}
            placeholder={t('community.postDetail.commentInputPlaceholder')}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
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
            {createComment.isPending
              ? t('community.postDetail.commentSubmitting')
              : t('community.postDetail.commentSubmit')}
          </button>
        </div>
      </div>

      {confirmCommentId && (
        <ConfirmDialog
          title={t('community.postDetail.commentDeleteTitle')}
          message={t('community.postDetail.commentDeleteMessage')}
          confirmLabel={t('community.postDetail.commentDelete')}
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
