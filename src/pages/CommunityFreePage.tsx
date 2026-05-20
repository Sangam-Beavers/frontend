import BottomNav from '@/components/BottomNav';
import CommunityTabs from '@/components/CommunityTabs';
import FeedPost from '@/components/FeedPost';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { FeedPostItem } from '@/types/community';
import styles from './CommunityFreePage.module.css';

const POSTS: FeedPostItem[] = [
  {
    id: 'winter-clothes',
    title: '한국 겨울 옷 어디서 사면 좋나요?',
    meta: '자유게시판 · 댓글 14',
    body: '처음 맞는 겨울이라 따뜻한 옷 추천 부탁해요.',
    avatarInitial: 'S',
    avatarTone: 'purple',
  },
  {
    id: 'topik-study',
    title: '오늘 TOPIK 공부 같이 할 사람?',
    meta: '자유게시판 · 좋아요 9',
    body: '퇴근 후 온라인으로 같이 공부해요.',
    avatarInitial: 'P',
    avatarTone: 'mid',
  },
];

export default function CommunityFreePage() {
  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={2} />}>
      <TopBar
        title="커뮤니티"
        rightAction={
          <button type="button" className={styles.searchIcon} aria-label="검색">
            🔍
          </button>
        }
      />

      <CommunityTabs active="free" />

      <div className={styles.banner}>
        <b>자유게시판</b>
        <span>질문, 잡담, 하루 이야기, 정보 공유를 자유롭게 남겨보세요.</span>
      </div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </MobileScreen>
  );
}
