import { useState } from 'react';
import { useParams } from 'react-router-dom';
import TopBar from '@/components/navigation/TopBar';
import { usePostDetail } from '@/hooks/usePostDetail';
import { useComments } from '@/hooks/useComments';
import { categoryLabel, formatCommunityDate } from '@/utils/communityFeed';
import styles from './CommunityPostDetailPage.module.css';

export default function CommunityPostDetailPage() {
  const { postId = '' } = useParams<{ postId: string }>();
  const [draft, setDraft] = useState<string>('');

  const { data: post, isLoading, error } = usePostDetail(postId);
  const { data: commentsData } = useComments(postId);
  const comments = commentsData?.comments ?? [];

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

      <div className={styles.section}>
        <span>댓글 {comments.length}</span>
        <span className={styles.pill}>작성자 수정/삭제</span>
      </div>

      {comments.map((comment) => (
        <div key={comment.public_id} className={styles.comment}>
          <div className={styles.commentAvatar}>{comment.author_nickname.charAt(0) || '?'}</div>
          <div className={styles.commentBody}>
            <div className={styles.commentName}>
              {comment.author_nickname}
              {comment.author_is_verified && <span className={styles.pill}>인증</span>}
            </div>
            <div className={styles.commentText}>{comment.content}</div>
            <div className={styles.commentMeta}>
              {formatCommunityDate(comment.created_at)} &middot; 답글 쓰기
            </div>
          </div>
        </div>
      ))}

      <div className={styles.commentInputRow}>
        <input
          type="text"
          className={styles.commentInput}
          placeholder="댓글을 입력하세요"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="button" className={styles.commentSubmit}>
          등록
        </button>
      </div>
    </>
  );
}
