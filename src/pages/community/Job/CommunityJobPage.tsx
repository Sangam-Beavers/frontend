import CommunityTabs from '@/components/community/CommunityTabs';
import FeedPost from '@/components/community/FeedPost';
import TopBar from '@/components/navigation/TopBar';
import { useQna } from '@/hooks/useQna';
import { COMMUNITY_POSTS_JOB_MOCK } from '@/mocks/communityMock';
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

const POSTS = COMMUNITY_POSTS_JOB_MOCK.result;

export default function CommunityJobPage() {
  // 주요 QnA — JOB 카테고리 답변 많은 순 Top 1 (api-spec §8).
  // 인증 불필요(공개 API)라 누구나 호출. 백엔드 응답: { posts: [{ public_id, title, comment_count, created_at }] }
  // 4상태 분리(로딩/에러/빈/정상) — 에러를 "빈 결과"로 오인 방지(CodeRabbit 리뷰 반영).
  const {
    data: qnaData,
    isLoading: isQnaLoading,
    error: qnaError,
  } = useQna({ category: 'JOB', size: 1 });
  const topQna = qnaData?.posts[0];

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
        {isQnaLoading && <div className={styles.qnaQuestion}>불러오는 중…</div>}
        {!isQnaLoading && qnaError && (
          <div className={styles.qnaQuestion}>
            질문을 불러오지 못했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}
        {!isQnaLoading && !qnaError && !topQna && (
          <div className={styles.qnaQuestion}>아직 등록된 질문이 없어요.</div>
        )}
        {topQna && (
          <>
            <div className={styles.qnaQuestion}>Q. {topQna.title}</div>
            <p className={styles.qnaMeta}>답변 {topQna.comment_count}</p>
          </>
        )}
      </div>
    </>
  );
}
