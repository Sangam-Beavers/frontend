import { useTranslation } from 'react-i18next';
import styles from './TranslateButton.module.css';

/**
 * 번역 보기 / 원문 보기 토글 버튼 (이슈 #160).
 *
 * <p>게시글·댓글 어디서나 재사용. 두 가지 외형(variant)을 지원한다:
 * <ul>
 *   <li><b>post</b> — 부모 컨테이너의 className(예: PostDetail의 `.secondary` 버튼 스타일)을 통째로 받아
 *       좋아요 버튼과 같은 .btnRow에서 동등하게 정렬되게 한다.</li>
 *   <li><b>comment</b> — 댓글 메타 라인에 어울리는 컴팩트 텍스트 버튼(인라인).</li>
 * </ul>
 *
 * <p>가드:
 * <ul>
 *   <li>`originalLanguage === targetLanguage` 면 `null` 반환(번역 불필요 — 버튼 자체 비노출).</li>
 *   <li>`originalLanguage`가 미정(undefined/'')이면 가드 못 한다 → 버튼은 그대로 노출 (백엔드 #161 호환).</li>
 * </ul>
 *
 * <p>상태 라벨:
 * <ul>
 *   <li>`isLoading` true → "번역 중…"</li>
 *   <li>`showOriginal` 토글로 번역된 상태인지 표시 — true면 "원문 보기", false면 "번역 보기".</li>
 * </ul>
 *
 * <p>이벤트는 단일 onClick — 호출 측에서 상태(번역됨/원문) 토글을 직접 관리한다.
 * 이중 핸들러(onTranslate/onToggleOriginal)로 나누지 않은 이유 — 같은 버튼의 라벨만 바뀌므로
 * 호출 측의 토글 로직이 더 단순해진다(true ↔ false).
 */
export interface TranslateButtonProps {
  /** 원문 언어 코드. undefined면 가드를 못해 버튼은 항상 노출. */
  originalLanguage?: string;
  /** 번역 대상 언어 (보통 i18n.language). */
  targetLanguage: string;
  /** 현재 화면이 번역된 상태인지(true) 원문 상태인지(false). */
  isTranslated: boolean;
  /** 번역 호출 진행 중 여부. true면 라벨 "번역 중…"·disabled. */
  isLoading: boolean;
  /** 버튼 클릭 시 호출. 호출 측에서 isTranslated 토글을 직접 처리. */
  onClick: () => void;
  /**
   * 외관 — post(좋아요 옆 동일 secondary 버튼) / comment(메타 인라인 텍스트).
   * @default 'post'
   */
  variant?: 'post' | 'comment';
  /**
   * post variant일 때 부모(예: PostDetail .secondary)의 클래스명을 그대로 받는다.
   * comment variant에서는 무시.
   */
  className?: string;
}

export default function TranslateButton({
  originalLanguage,
  targetLanguage,
  isTranslated,
  isLoading,
  onClick,
  variant = 'post',
  className,
}: TranslateButtonProps) {
  const { t } = useTranslation();

  // 원문 언어 == 대상 언어면 번역 자체가 무의미 → 버튼 비노출.
  if (originalLanguage && originalLanguage === targetLanguage) {
    return null;
  }

  const label = isLoading
    ? t('community.postDetail.translating')
    : isTranslated
      ? t('community.postDetail.showOriginal')
      : t('community.postDetail.translate');

  if (variant === 'comment') {
    return (
      <button
        type="button"
        className={styles.commentTranslate}
        disabled={isLoading}
        onClick={onClick}
      >
        {label}
      </button>
    );
  }

  return (
    <button type="button" className={className} disabled={isLoading} onClick={onClick}>
      {label}
    </button>
  );
}
