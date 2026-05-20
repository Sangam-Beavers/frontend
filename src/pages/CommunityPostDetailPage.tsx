import { useState } from 'react';
import BottomNav from '@/components/BottomNav';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { PostComment, PostDetail } from '@/types/community';
import styles from './CommunityPostDetailPage.module.css';

const POST: PostDetail = {
  id: 'roommate',
  authorName: 'Linh',
  authorVerified: true,
  authorMeta: '친절한 온도: 매우 좋음 · 베트남어',
  authorAvatarInitial: 'L',
  title: '기숙사 룸메이트 후기 공유',
  body: '같이 살 때 청소 규칙을 먼저 정하면 훨씬 편해요. 계약 전에 보증금과 공과금 분담도 꼭 확인하세요.',
  hasImage: true,
  likeCount: 38,
};

const COMMENTS: PostComment[] = [
  {
    id: 'c1',
    authorName: 'Minh',
    authorVerified: true,
    avatarInitial: 'M',
    text: '좋은 정보 감사합니다!',
    createdAt: '2021.04.13. 09:39',
  },
  {
    id: 'c2',
    authorName: 'Tara',
    authorVerified: false,
    avatarInitial: 'T',
    text: '번역 보기로 이해됐어요.',
    createdAt: '2021.04.13. 09:40',
  },
  {
    id: 'c3',
    authorName: '현지탐방러',
    authorVerified: false,
    avatarInitial: '현',
    text: '좋은 후기예요.',
    createdAt: '2021.04.13. 09:39',
  },
];

export default function CommunityPostDetailPage() {
  const [draft, setDraft] = useState<string>('');

  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={2} />}>
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
    </MobileScreen>
  );
}
