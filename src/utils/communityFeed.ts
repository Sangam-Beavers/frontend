import type { PostSummaryItem } from '@/api/community';
import type { FeedPostItem } from '@/types/community';

/** 백엔드 카테고리(대문자) → 화면 표시 라벨. */
const CATEGORY_LABEL: Record<string, string> = {
  LIFE_INFO: '생활',
  JOB: '취업',
  VISA: '비자',
  COUNTRY: '국가별 정보',
  RESIDENCE: '거주',
  QUESTION: '질문',
  FREE: '자유게시판',
};

/** 백엔드 카테고리(대문자) → 화면 표시 라벨. 매핑 없으면 원본 반환. */
export function categoryLabel(category: string): string {
  return CATEGORY_LABEL[category] ?? category;
}

/** ISO 8601(UTC) 문자열 → "YYYY.MM.DD. HH:mm" (로컬 시간). 파싱 실패 시 원본 반환. */
export function formatCommunityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}. ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * ISO 8601(UTC) 문자열 → 짧은 상대 시간("방금 전"/"N분 전"/"N시간 전"/"N일 전").
 * 7일을 넘으면 "YYYY.MM.DD"(날짜만). 파싱 실패 시 원본 반환. 목록 메타처럼 좁은 영역용.
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return '방금 전';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}일 전`;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
}

/**
 * API 게시글 요약(PostSummaryItem) → FeedPost 표시용 항목(FeedPostItem) 매핑.
 * 커뮤니티 목록 화면들이 공용으로 사용한다.
 */
export function toFeedPostItem(item: PostSummaryItem): FeedPostItem {
  const label = CATEGORY_LABEL[item.category] ?? item.category;
  return {
    id: item.public_id,
    title: item.title,
    body: item.content_preview,
    meta: `${item.author_nickname} · ${label} · 댓글 ${item.comment_count} · 좋아요 ${item.like_count}`,
    // 같은 작성자 → 항상 같은 identicon. 마이페이지와 동일하게 작성자 public_id를 시드로 쓴다
    // (닉네임을 바꿔도 그림 유지 + 같은 사용자는 어디서든 같은 그림). 빈 값이면 닉네임/글 id로 폴백.
    avatarSeed: item.author_public_id || item.author_nickname || item.public_id,
    avatarImageUrl: item.author_profile_image_url ?? null,
    language: item.language,
  };
}
