import { useNavigate } from 'react-router-dom';
import BottomNav from '@/components/BottomNav';
import CommunityTabs from '@/components/CommunityTabs';
import FeedPost from '@/components/FeedPost';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { FeedPostItem } from '@/types/community';
import styles from './CommunityPage.module.css';

const POSTS: FeedPostItem[] = [
  {
    id: 'roommate',
    title: '기숙사 룸메이트 후기 공유',
    meta: 'Linh · 인증 · 거주 · 댓글 12 · 좋아요 38',
    body: '청소 규칙과 공과금 분담은 계약 전에 꼭 확인하세요.',
    avatarInitial: 'L',
    avatarTone: 'best',
  },
  {
    id: 'pho',
    title: '서울에서 베트남 음식 맛집 찾았어요',
    meta: 'Minh · 생활 · 번역 보기',
    body: '고향 맛이 나는 쌀국수집 공유합니다.',
    avatarInitial: 'M',
    avatarTone: 'good',
  },
  {
    id: 'logistics-interview',
    title: '물류센터 면접 후기와 준비물',
    meta: 'Tara · 취업 · 댓글 8',
    body: '면접 질문, 근무시간, 통근버스 정보를 정리했어요.',
    avatarInitial: 'T',
    avatarTone: 'mid',
  },
];

export default function CommunityPage() {
  const navigate = useNavigate();
  return (
    <MobileScreen bottomSlot={<BottomNav activeIndex={2} />}>
      <TopBar
        title="커뮤니티"
        showBack={false}
        rightAction={
          <button type="button" className={styles.searchIcon} aria-label="검색">
            🔍
          </button>
        }
      />

      <CommunityTabs active="all" />

      <div className={styles.search}>궁금한 생활 정보, 일자리, 거주 후기를 검색해보세요</div>

      <div className={styles.actions}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.primary}`}
          onClick={() => navigate('/community/write')}
        >
          글쓰기
        </button>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.ghost}`}
          onClick={() => navigate('/mypage')}
        >
          내 관심글
        </button>
      </div>

      <div className={styles.section}>전체 게시글</div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </MobileScreen>
  );
}
