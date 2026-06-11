import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Identicon from '@/components/common/Identicon';
import { useCommentTranslation } from '@/hooks/useCommentTranslation';
import { formatCommunityDate } from '@/utils/communityFeed';
import { translationErrorMessage } from '@/utils/translationErrorMessage';
import type { CommentItem } from '@/api/community';
import TranslateButton from './TranslateButton';

/**
 * 댓글 한 건 (이슈 #160) — "번역 보기" 토글 포함.
 *
 * <p>댓글마다 독립적인 번역 상태(`showTranslated`)를 useState로 가진다.
 * 한 댓글이 번역돼도 다른 댓글은 원문 그대로 유지된다.
 *
 * <p>같은 댓글의 번역 ↔ 원문 토글은 react-query 캐시(staleTime=Infinity)로 즉시 전환.
 * 두 번째 "번역 보기" 클릭은 네트워크 호출 없이 표시된다.
 *
 * <p>삭제 버튼은 본인 댓글에만 노출. 부모(PostDetail)가 onRequestDelete 콜백으로
 * ConfirmDialog를 띄운다(상세 페이지의 ConfirmDialog 상태는 한 개로 통일).
 */
export interface CommentProps {
  postId: string;
  comment: CommentItem;
  /** 삭제 버튼 클릭 시 호출 (부모가 ConfirmDialog 띄움). */
  onRequestDelete: (commentId: string) => void;
  /** 인증 배지 텍스트(부모에서 i18n 결정해 주입). */
  verifiedLabel: string;
  /** 댓글 메타 라인의 "삭제" 라벨(부모에서 i18n). */
  deleteLabel: string;
  /** 메타 라인 스타일 클래스(.commentMeta), 부모 모듈 CSS에서 받는다. */
  metaClassName: string;
  /** 부모 모듈 CSS의 클래스 묶음 — 각각 .comment/.commentAvatar/.commentBody/.commentName/.commentText/.verifiedPill/.commentDelete. */
  classNames: {
    root: string;
    avatar: string;
    avatarImg: string;
    body: string;
    name: string;
    verifiedPill: string;
    text: string;
    delete: string;
    error: string;
  };
}

export default function Comment({
  postId,
  comment,
  onRequestDelete,
  verifiedLabel,
  deleteLabel,
  metaClassName,
  classNames,
}: CommentProps) {
  const { t, i18n } = useTranslation();
  const [showTranslated, setShowTranslated] = useState<boolean>(false);

  const targetLanguage = i18n.language;
  const {
    data: translation,
    isFetching,
    error,
  } = useCommentTranslation(postId, comment.public_id, targetLanguage, showTranslated);

  // 번역 호출 에러 메시지는 렌더 중 파생한다 — effect 안 setState(연쇄 렌더) 대신.
  // 재요청 중(isFetching)엔 직전 에러를 숨겨 깜빡임을 막는다.
  const translateError = error && !isFetching ? translationErrorMessage(error, t) : null;

  // 새 에러가 발생하면 번역 토글을 꺼 둔다(다음 클릭이 재시도가 되도록).
  // effect가 아니라 "렌더 중 상태 조정"(React 권장 패턴): 직전과 다른 에러일 때만 1회 반영.
  const [seenError, setSeenError] = useState<unknown>(null);
  if (error !== seenError) {
    setSeenError(error);
    if (error) setShowTranslated(false);
  }

  const displayContent =
    showTranslated && translation ? translation.translated_content : comment.content;

  const handleToggle = () => {
    setShowTranslated((prev) => !prev);
  };

  return (
    <div className={classNames.root}>
      <div
        className={classNames.avatar}
        style={{ filter: `hue-rotate(${comment.author_avatar_hue ?? 0}deg)` }}
      >
        {comment.author_profile_image_url ? (
          <img src={comment.author_profile_image_url} alt="" className={classNames.avatarImg} />
        ) : (
          <Identicon
            seed={comment.author_public_id || comment.author_nickname || comment.public_id}
          />
        )}
      </div>
      <div className={classNames.body}>
        <div className={classNames.name}>
          {comment.author_nickname}
          {comment.author_is_verified && (
            <span className={classNames.verifiedPill}>{verifiedLabel}</span>
          )}
        </div>
        <div className={classNames.text}>{displayContent}</div>
        <div className={metaClassName}>
          <span>{formatCommunityDate(comment.created_at)}</span>
          <TranslateButton
            variant="comment"
            originalLanguage={comment.language}
            targetLanguage={targetLanguage}
            isTranslated={showTranslated && Boolean(translation)}
            isLoading={isFetching}
            onClick={handleToggle}
          />
          {comment.is_author && (
            <button
              type="button"
              className={classNames.delete}
              onClick={() => onRequestDelete(comment.public_id)}
            >
              {deleteLabel}
            </button>
          )}
        </div>
        {translateError && <div className={classNames.error}>{translateError}</div>}
      </div>
    </div>
  );
}
