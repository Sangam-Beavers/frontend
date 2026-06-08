import { useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import TranslateButton from '@/components/community/TranslateButton';
import { buildCommunityPostPath } from '@/constants/routes';
import { usePostTranslation } from '@/hooks/usePostTranslation';
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

  const avatarClass = `${styles.avatar} ${AVATAR_CLASS[post.avatarTone]}`.trim();
  const isShowingTranslation = showTranslated && Boolean(translation);
  const titleText = isShowingTranslation ? translation!.translated_title : post.title;
  const bodyText = isShowingTranslation ? translation!.translated_content : post.body;

  const handleTranslateClick = (event: MouseEvent<HTMLButtonElement>) => {
    // 카드 onClick의 네비게이션을 막아야 한다 — 버튼만 단독 동작.
    event.stopPropagation();
    setShowTranslated((prev) => !prev);
  };

  return (
    <article
      className={styles.post}
      onClick={() => navigate(buildCommunityPostPath(post.id))}
      style={{ cursor: 'pointer' }}
    >
      <div className={styles.head}>
        <div className={avatarClass}>{post.avatarInitial}</div>
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
