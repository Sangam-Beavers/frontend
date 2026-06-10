import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Identicon from '@/components/common/Identicon';
import TranslateButton from '@/components/community/TranslateButton';
import { buildCommunityPostPath } from '@/constants/routes';
import { usePostTranslation } from '@/hooks/usePostTranslation';
import type { AvatarTone, FeedPostItem } from '@/types/community';
import styles from './FeedPost.module.css';

interface FeedPostProps {
  post: FeedPostItem;
}

/**
 * 신뢰등급 테두리 톤 → CSS 클래스 (이슈 #175).
 * Phase 1에서 실제 생성되는 톤은 'good'(VERIFIED 초록 실선)·'default'(NEWCOMER·누락 회색 점선) 2개.
 * 매핑에 없는 톤(미사용 레거시 값 포함)은 회색('default')으로 폴백.
 */
const AVATAR_TONE_CLASS: Partial<Record<AvatarTone, string>> = {
  good: styles.avatarVerified,
  default: styles.avatarNewcomer,
};

/**
 * 커뮤니티 목록 카드 + 카드별 번역 토글 (이슈 #160 후속).
 *
 * <p>제목/본문 미리보기를 사용자 언어로 번역해서 보여준다 — 카드별 독립 상태(다른 카드 영향 X).
 * 번역 호출은 react-query 캐시(usePostTranslation)에 들어가 한 번 누른 뒤엔 토글이 즉시 동작.
 *
 * <p>가드: post.language === i18n.language면 TranslateButton이 null 반환해 버튼 비노출.
 *
 * <p>이벤트 격리: 카드 전체가 상세 페이지 네비게이션이라 번역 버튼 클릭 시 stopPropagation이 필수다.
 */
export default function FeedPost({ post }: FeedPostProps) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [showTranslated, setShowTranslated] = useState(false);
  const targetLanguage = i18n.language;

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

  return (
    <article
      className={styles.post}
      onClick={() => navigate(buildCommunityPostPath(post.id))}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.head}>
        <div
          className={`${styles.avatar} ${AVATAR_TONE_CLASS[post.avatarTone ?? 'default'] ?? styles.avatarNewcomer}`}
        >
          {post.avatarImageUrl ? (
            <img src={post.avatarImageUrl} alt="" className={styles.avatarImg} />
          ) : (
            <Identicon seed={post.avatarSeed} />
          )}
        </div>
        <div>
          <b>{titleText}</b>
          <p>{post.meta}</p>
        </div>
      </div>
      <div className={styles.text}>{bodyText}</div>
      <div className={styles.actions} onClick={(event) => event.stopPropagation()}>
        <TranslateButton
          variant="comment"
          originalLanguage={post.language}
          targetLanguage={targetLanguage}
          isTranslated={isShowingTranslation}
          isLoading={isTranslating}
          onClick={handleTranslateClick}
        />
      </div>
    </article>
  );
}
