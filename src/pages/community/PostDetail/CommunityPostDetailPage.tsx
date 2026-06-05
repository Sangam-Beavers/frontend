import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import TopBar from '@/components/navigation/TopBar';
import { buildCommunityPostEditPath } from '@/constants/routes';
import { useComments } from '@/hooks/useComments';
import { useCreateComment } from '@/hooks/useCreateComment';
import { useDeleteComment } from '@/hooks/useDeleteComment';
import { useDeletePost } from '@/hooks/useDeletePost';
import { usePostDetail } from '@/hooks/usePostDetail';
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

  const handleSubmitComment = () => {
    const content = draft.trim();
    if (content === '' || createComment.isPending) return;
    createComment.mutate({ content }, { onSuccess: () => setDraft('') });
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

  return (
    <>
      <TopBar
        title="게시글"
        rightAction={
          <button type="button" className={styles.reportBtn}>
            신고
          </button>
        }
      />

      <div className={styles.authorCard}>
        <div className={styles.authorRow}>
          <div className={`${styles.avatar} ${styles.avatarBest}`}>
            {post.author_nickname.charAt(0) || '?'}
          </div>
          <div className={styles.authorMain}>
            <div className={styles.authorName}>
              {post.author_nickname}
              {post.author_is_verified && <span className={styles.pill}>인증</span>}
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
        <button type="button" className={styles.secondary}>
          좋아요 {post.like_count}
        </button>
      </div>

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
                {comment.author_is_verified && <span className={styles.pill}>인증</span>}
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
