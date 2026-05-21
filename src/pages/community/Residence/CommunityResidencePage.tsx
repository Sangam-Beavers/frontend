import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { COMMUNITY_POSTS_RESIDENCE_MOCK } from '@/mocks/communityMock';
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

const POSTS = COMMUNITY_POSTS_RESIDENCE_MOCK.result;

export default function CommunityResidencePage() {
  return (
    <>
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
    </>
  );
}
