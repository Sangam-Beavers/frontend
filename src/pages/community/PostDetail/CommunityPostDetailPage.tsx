import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ApiException } from '@/api';
import Comment from '@/components/community/Comment';
import TranslateButton from '@/components/community/TranslateButton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import Identicon from '@/components/common/Identicon';
import TopBar from '@/components/navigation/TopBar';
import { buildCommunityPostEditPath } from '@/constants/routes';
import { useComments } from '@/hooks/useComments';
import { useCreateComment } from '@/hooks/useCreateComment';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { useDeletePost } from '@/hooks/useDeletePost';
import { usePostDetail } from '@/hooks/usePostDetail';
import { usePostTranslation } from '@/hooks/usePostTranslation';
import { useToggleLike } from '@/hooks/useToggleLike';
import { trustGradeToTone } from '@/utils/trustGrade';
import type { AvatarTone } from '@/types/community';
import { categoryLabel, formatCommunityDate } from '@/utils/communityFeed';
import { normalizeAppLanguage } from '@/utils/detectLanguage';
import { communityErrorMessage } from '@/utils/communityErrorMessage';
import { translationErrorMessage } from '@/utils/translationErrorMessage';
import styles from './CommunityPostDetailPage.module.css';

/** 신뢰등급 테두리 톤 → CSS 클래스 (FeedPost/MyPage와 동일 팔레트). */
const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  best: styles.avatarConnected,
  purple: styles.avatarTrusted,
  gold: styles.avatarGold,
  default: styles.avatarNewcomer,
};

export default function CommunityPostDetailPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { postId = '' } = useParams<{ postId: string }>();
  const [draft, setDraft] = useState<string>('');
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [confirmCommentId, setConfirmCommentId] = useState<string | null>(null);

  // 이슈 #160 — 게시글 번역 상태. 같은 (post, language) 조합은 react-query 캐시에 들어가
  // 토글 시 즉시 전환. 사용자가 i18n.language를 바꾸면 새 key로 다시 호출된다.
  const [showTranslated, setShowTranslated] = useState<boolean>(false);

  const { data: post, isLoading, error } = usePostDetail(postId);
  // 번역 대상 언어 — 지역 코드(ko-KR 등)는 백엔드 화이트리스트(ko)와 안 맞아 COMMUNITY4003이 되므로 정규화.
  const targetLanguage = normalizeAppLanguage(i18n.language);
  const {
    data: translation,
    isFetching: isTranslating,
    error: translateApiError,
  } = usePostTranslation(postId, targetLanguage, showTranslated);

  // 번역 호출 에러 메시지는 렌더 중 파생한다 — effect 안 setState(연쇄 렌더) 대신.
  // 재요청 중(isTranslating)엔 직전 에러를 숨겨 깜빡임을 막는다.
  const translateError =
    translateApiError && !isTranslating ? translationErrorMessage(translateApiError, t) : null;

  // 새 에러가 발생하면 번역 토글을 꺼 둔다(다음 클릭이 재시도가 되도록).
  // effect가 아니라 "렌더 중 상태 조정"(React 권장 패턴): 직전과 다른 에러일 때만 1회 반영.
  const [seenTranslateError, setSeenTranslateError] = useState<unknown>(null);
  if (translateApiError !== seenTranslateError) {
    setSeenTranslateError(translateApiError);
    if (translateApiError) setShowTranslated(false);
  }
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
          <div
            className={`${styles.avatar} ${AVATAR_TONE_CLASS[trustGradeToTone(post.author_trust_grade)] ?? styles.avatarNewcomer}`}
            style={{ filter: `hue-rotate(${post.author_avatar_hue ?? 0}deg)` }}
          >
            {post.author_profile_image_url ? (
              <img src={post.author_profile_image_url} alt="" className={styles.avatarImg} />
            ) : (
              <Identicon seed={post.author_public_id || post.author_nickname || post.public_id} />
            )}
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

      <h2 className={styles.title}>
        {showTranslated && translation ? translation.translated_title : post.title}
      </h2>
      <p className={styles.body}>
        {showTranslated && translation ? translation.translated_content : post.content}
      </p>

      <div className={styles.btnRow}>
        <TranslateButton
          variant="post"
          className={styles.secondary}
          originalLanguage={post.language}
          targetLanguage={targetLanguage}
          isTranslated={showTranslated && Boolean(translation)}
          isLoading={isTranslating}
          onClick={() => setShowTranslated((prev) => !prev)}
        />
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

      {translateError && <div className={styles.likeError}>{translateError}</div>}
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
          <Comment
            key={comment.public_id}
            postId={postId}
            comment={comment}
            onRequestDelete={setConfirmCommentId}
            verifiedLabel={t('mypage.verifiedBadge')}
            deleteLabel={t('community.postDetail.commentDelete')}
            metaClassName={styles.commentMeta}
            classNames={{
              root: styles.comment,
              avatar: styles.commentAvatar,
              avatarImg: styles.avatarImg,
              body: styles.commentBody,
              name: styles.commentName,
              verifiedPill: styles.verifiedPill,
              text: styles.commentText,
              delete: styles.commentDelete,
              error: styles.commentError,
            }}
          />
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
