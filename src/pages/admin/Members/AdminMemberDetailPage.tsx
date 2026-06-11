import { useNavigate, useParams } from 'react-router-dom';
import { adminMemberApi, type UserPostView, type UserCommentView } from '@/api/admin';
import { useQuery } from '@tanstack/react-query';
import styles from './AdminMemberDetailPage.module.css';

function formatDate(iso: string) {
  return iso ? iso.replace('T', ' ').slice(0, 16) : '-';
}

export default function AdminMemberDetailPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'member-activity', userId],
    queryFn: () => adminMemberApi.getActivity(userId!, { size: 20 }),
    enabled: !!userId,
  });

  const posts: UserPostView[] = data?.posts ?? [];
  const comments: UserCommentView[] = data?.comments ?? [];

  return (
    <div className={styles.wrap}>
      <div className={styles.topBar}>
        <button type="button" className={styles.iconBtn} onClick={() => navigate(-1)}>
          ‹
        </button>
        <span className={styles.title}>회원 활동 내역</span>
        <div style={{ width: 40 }} />
      </div>

      <div className={styles.uid}>{userId}</div>

      {isLoading ? (
        <div className={styles.empty}>불러오는 중...</div>
      ) : (
        <>
          {/* 게시글 */}
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>작성한 글</span>
            <span className={styles.sectionCount}>{data?.post_total ?? 0}개</span>
          </div>
          {posts.length === 0 ? (
            <div className={styles.emptySection}>작성한 글이 없습니다.</div>
          ) : (
            <div className={styles.list}>
              {posts.map((p) => (
                <div key={p.public_id} className={styles.postCard}>
                  <div className={styles.postHeader}>
                    <span className={styles.category}>{p.category}</span>
                    <span className={styles.postDate}>{formatDate(p.created_at)}</span>
                  </div>
                  <div className={styles.postTitle}>{p.title}</div>
                  <div className={styles.postMeta}>
                    댓글 {p.comment_count} · 좋아요 {p.like_count}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 댓글 */}
          <div className={styles.sectionHeader} style={{ marginTop: 20 }}>
            <span className={styles.sectionTitle}>작성한 댓글</span>
            <span className={styles.sectionCount}>{data?.comment_total ?? 0}개</span>
          </div>
          {comments.length === 0 ? (
            <div className={styles.emptySection}>작성한 댓글이 없습니다.</div>
          ) : (
            <div className={styles.list}>
              {comments.map((c) => (
                <div key={c.public_id} className={styles.commentCard}>
                  <div className={styles.commentContent}>{c.content}</div>
                  <div className={styles.commentMeta}>
                    좋아요 {c.like_count} · {formatDate(c.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
