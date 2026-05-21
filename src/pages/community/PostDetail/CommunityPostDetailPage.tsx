import { useState } from 'react';
import TopBar from '@/components/navigation/TopBar';
import { POST_COMMENTS_MOCK, POST_DETAIL_MOCK } from '@/mocks/communityMock';
import styles from './CommunityPostDetailPage.module.css';

const POST = POST_DETAIL_MOCK.result;
const COMMENTS = POST_COMMENTS_MOCK.result;

export default function CommunityPostDetailPage() {
  const [draft, setDraft] = useState<string>('');

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
          <div className={`${styles.avatar} ${styles.avatarBest}`}>{POST.authorAvatarInitial}</div>
          <div className={styles.authorMain}>
            <div className={styles.authorName}>
              {POST.authorName}
              {POST.authorVerified && <span className={styles.pill}>인증</span>}
            </div>
            <div className={styles.authorMeta}>{POST.authorMeta}</div>
          </div>
        </div>
      </div>

      <h2 className={styles.title}>{POST.title}</h2>
      <p className={styles.body}>{POST.body}</p>

      {POST.hasImage && (
        <div className={styles.preview}>
          <span aria-hidden>🖼️</span>
          <span>첨부 이미지</span>
        </div>
      )}

      <div className={styles.btnRow}>
        <button type="button" className={styles.secondary}>
          번역 보기
        </button>
        <button type="button" className={styles.secondary}>
          좋아요 {POST.likeCount}
        </button>
      </div>

      <div className={styles.section}>
        <span>댓글 {COMMENTS.length}</span>
        <span className={styles.pill}>작성자 수정/삭제</span>
      </div>

      {COMMENTS.map((comment) => (
        <div key={comment.id} className={styles.comment}>
          <div className={styles.commentAvatar}>{comment.avatarInitial}</div>
          <div className={styles.commentBody}>
            <div className={styles.commentName}>
              {comment.authorName}
              {comment.authorVerified && <span className={styles.pill}>인증</span>}
            </div>
            <div className={styles.commentText}>{comment.text}</div>
            <div className={styles.commentMeta}>{comment.createdAt} &middot; 답글 쓰기</div>
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
