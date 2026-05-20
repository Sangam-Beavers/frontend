import BottomNav from '@/components/BottomNav';
import CommunityTabs from '@/components/CommunityTabs';
import FeedPost from '@/components/FeedPost';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { FeedPostItem } from '@/types/community';
import styles from './CommunityResidencePage.module.css';

interface TemperatureChip {
  label: string;
  toneClass: string;
}

const TEMPERATURES: TemperatureChip[] = [
  { label: '주의', toneClass: styles.tempRed },
  { label: '보통 이하', toneClass: styles.tempYellow },
  { label: '보통', toneClass: styles.tempGreen },
  { label: '좋음', toneClass: styles.tempPurple },
  { label: '매우 좋음', toneClass: styles.tempBlue },
];

const POSTS: FeedPostItem[] = [
  {
    id: 'guro-room',
    title: '구로 룸메이트 구합니다',
    meta: '생활온도 매우 좋음 · 월 35만원 · 즉시 입주',
    body: '여성 전용, 역에서 8분 거리. 계약 전 직접 확인 가능해요.',
    avatarInitial: 'R',
    avatarTone: 'best',
  },
  {
    id: 'dorm-deal',
    title: '기숙사 급매 정보 공유',
    meta: '부동산 · 보증금 낮음 · 댓글 5',
    body: '공장 근처 기숙사 자리가 생겨서 공유합니다.',
    avatarInitial: 'H',
    avatarTone: 'good',
  },
];

export default function CommunityResidencePage() {
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

      <CommunityTabs active="residence" />

      <div className={styles.banner}>
        <b>거주 게시판</b>
        <span>부동산 · 급매 · 룸메 구하기 · 생활온도</span>
      </div>

      <div className={styles.tempStrip}>
        {TEMPERATURES.map((chip) => (
          <span key={chip.label} className={`${styles.temp} ${chip.toneClass}`}>
            {chip.label}
          </span>
        ))}
      </div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}
    </MobileScreen>
  );
}
