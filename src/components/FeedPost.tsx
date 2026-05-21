import { useNavigate } from 'react-router-dom';
import type { AvatarTone, FeedPostItem } from '@/types/community';
import styles from './FeedPost.module.css';

interface FeedPostProps {
  post: FeedPostItem;
}

const AVATAR_CLASS: Record<AvatarTone, string> = {
  best: styles.avatarBest,
  good: styles.avatarGood,
  mid: styles.avatarMid,
  warn: styles.avatarWarn,
  bad: styles.avatarBad,
  purple: styles.avatarPurple,
  default: '',
};

export default function FeedPost({ post }: FeedPostProps) {
  const navigate = useNavigate();
  const avatarClass = `${styles.avatar} ${AVATAR_CLASS[post.avatarTone]}`.trim();

  return (
    <article
      className={styles.post}
      onClick={() => navigate(`/community/posts/${post.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.head}>
        <div className={avatarClass}>{post.avatarInitial}</div>
        <div>
          <b>{post.title}</b>
          <p>{post.meta}</p>
        </div>
      </div>
      <div className={styles.text}>{post.body}</div>
    </article>
  );
}
