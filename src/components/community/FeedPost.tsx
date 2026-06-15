import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Identicon from '@/components/common/Identicon';
import TranslateButton from '@/components/community/TranslateButton';
import ReportModal from '@/components/community/ReportModal';
import { buildCommunityPostPath } from '@/constants/routes';
import { usePostTranslation } from '@/hooks/usePostTranslation';
import { useReportPost } from '@/hooks/useReportPost';
import { reportErrorMessage } from '@/utils/reportErrorMessage';
import type { AvatarTone, FeedPostItem } from '@/types/community';
import styles from './FeedPost.module.css';

interface FeedPostProps {
  post: FeedPostItem;
}

/**
 * 신뢰등급 테두리 톤 → CSS 클래스 (이슈 #175 + Phase 2 FE-5).
 * 실제 생성되는 톤 4개: 'good'(VERIFIED 초록) · 'best'(CONNECTED 파랑) · 'purple'(TRUSTED 보라)
 * · 'default'(NEWCOMER·누락 회색 점선). 톤→색 근거는 utils/trustGrade.ts 주석 참고.
 * 매핑에 없는 톤(미사용 레거시 값 포함)은 회색('default')으로 폴백.
 */
const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  best: styles.avatarConnected,
  purple: styles.avatarTrusted,
  gold: styles.avatarGold,
  default: styles.avatarNewcomer,
};

/**
 * 커뮤니티 목록 한 행(row) + 행별 번역 토글 (이슈 #160 후속).
 *
 * <p>여러 행이 모이면 {@code :first-of-type}/{@code :last-of-type}로 하나의 박스처럼 보인다(테두리 공유).
 * 레이아웃: 상단 = 아바타·메타(닉네임·카테고리·댓글·좋아요)(좌) + 신고(우), 제목, 본문, 번역 보기(우측 하단).
 *
 * <p>이벤트 격리: 행 전체가 상세 페이지 네비게이션이라 신고·번역 클릭 시 stopPropagation이 필수다.
 */
export default function FeedPost({ post }: FeedPostProps) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [showTranslated, setShowTranslated] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const targetLanguage = i18n.language;
  const reportPost = useReportPost(post.id);

  const { data: translation, isFetching: isTranslating } = usePostTranslation(
    post.id,
    targetLanguage,
    showTranslated
  );

  const isShowingTranslation = showTranslated && Boolean(translation);
  const titleText = isShowingTranslation ? translation!.translated_title : post.title;
  const bodyText = isShowingTranslation ? translation!.translated_content : post.body;

  const handleTranslateClick = () => {
    setShowTranslated((prev) => !prev);
  };

  // 상단 메타 — 첫 토막(닉네임)은 진하게/크게, 나머지(카테고리 등)는 옅게 표시.
  const [nickname, ...metaRest] = post.meta.split(' · ');
  const metaRestText = metaRest.join(' · ');

  return (
    <article
      className={styles.post}
      onClick={() => navigate(buildCommunityPostPath(post.id))}
      style={{ cursor: 'pointer' }}
    >
      {/* 상단: 아바타 + 메타(닉네임·카테고리·댓글·좋아요)(좌) + 신고(우) */}
      <div className={styles.top}>
        <div className={styles.author}>
          <div
            className={`${styles.avatar} ${AVATAR_TONE_CLASS[post.avatarTone ?? 'default'] ?? styles.avatarNewcomer}`}
            style={{ filter: `hue-rotate(${post.avatarHue ?? 0}deg)` }}
          >
            {post.avatarImageUrl ? (
              <img src={post.avatarImageUrl} alt="" className={styles.avatarImg} />
            ) : (
              <Identicon seed={post.avatarSeed} />
            )}
          </div>
          <span className={styles.meta}>
            <b className={styles.nickname}>{nickname}</b>
            {metaRestText && <span className={styles.metaRest}>{` · ${metaRestText}`}</span>}
          </span>
        </div>
        <button
          type="button"
          className={styles.reportBtn}
          onClick={(event) => {
            event.stopPropagation();
            reportPost.reset();
            setShowReport(true);
          }}
        >
          {t('community.report.button')}
        </button>
      </div>

      <b className={styles.title}>{titleText}</b>
      <div className={styles.text}>{bodyText}</div>

      {/* 하단: 댓글·좋아요(좌) + 번역 보기(우) */}
      <div className={styles.footer}>
        <span className={styles.stats}>{post.stats}</span>
        <span className={styles.translateWrap} onClick={(event) => event.stopPropagation()}>
          <TranslateButton
            variant="comment"
            originalLanguage={post.language}
            targetLanguage={targetLanguage}
            isTranslated={isShowingTranslation}
            isLoading={isTranslating}
            onClick={handleTranslateClick}
          />
        </span>
      </div>

      {showReport && (
        <ReportModal
          onSubmit={(body) =>
            reportPost.mutate(body, {
              onSuccess: () => setShowReport(false),
            })
          }
          onCancel={() => {
            setShowReport(false);
            reportPost.reset();
          }}
          isPending={reportPost.isPending}
          error={reportPost.error ? reportErrorMessage(reportPost.error, t) : null}
        />
      )}
    </article>
  );
}
