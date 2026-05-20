import BottomNav from '@/components/BottomNav';
import CommunityTabs from '@/components/CommunityTabs';
import FeedPost from '@/components/FeedPost';
import MobileScreen from '@/components/MobileScreen';
import TopBar from '@/components/TopBar';
import type { FeedPostItem } from '@/types/community';
import styles from './CommunityJobPage.module.css';

interface QuickItem {
  id: string;
  label: string;
}

const QUICK_ITEMS: QuickItem[] = [
  { id: 'recommend', label: '💼 일자리 추천' },
  { id: 'rating', label: '🏢 기업 평가' },
  { id: 'qna', label: '❓ 주요 QnA' },
  { id: 'interview', label: '📝 면접 후기' },
];

const POSTS: FeedPostItem[] = [
  {
    id: 'manufacturing',
    title: '기숙사 제공 제조업 공고 모음',
    meta: '관리자 · 잡코리아 연동 · 광고',
    body: '야간수당, 통근버스, 비자 가능 여부를 확인해보세요.',
    avatarInitial: 'A',
    avatarTone: 'best',
  },
];

export default function CommunityJobPage() {
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

      <CommunityTabs active="job" />

      <div className={styles.jobAd}>
        <b>잡코리아 연동 공고</b>
        <span>외국인 가능 · 기숙사 제공 · 비자 지원 공고를 추천해요</span>
        <button type="button" className={styles.jobAdBtn}>
          공고 보기
        </button>
      </div>

      <div className={styles.quickGrid}>
        {QUICK_ITEMS.map((item) => (
          <button key={item.id} type="button" className={styles.quickCard}>
            {item.label}
          </button>
        ))}
      </div>

      {POSTS.map((post) => (
        <FeedPost key={post.id} post={post} />
      ))}

      <div className={styles.qnaCard}>
        <b>주요 QnA</b>
        <div className={styles.qnaQuestion}>Q. E-9 비자로 근무지 변경이 가능한가요?</div>
        <p className={styles.qnaMeta}>사용자 답변 6 · 관리자 답변 1</p>
      </div>
    </MobileScreen>
  );
}
