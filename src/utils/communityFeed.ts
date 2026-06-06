import type { PostSummaryItem } from '@/api/community';
import type { AvatarTone, FeedPostItem } from '@/types/community';

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

const TONES: AvatarTone[] = ['best', 'good', 'mid', 'warn', 'bad', 'purple'];

/**
 * 아바타 톤 — API 응답엔 톤이 없어 닉네임 기반으로 결정적으로 파생(표시용 색 다양화).
 * 같은 작성자는 항상 같은 톤이 된다.
 */
function toneFor(seed: string): AvatarTone {
  let sum = 0;
  for (const ch of seed) sum += ch.charCodeAt(0);
  return TONES[sum % TONES.length];
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
    avatarInitial: item.author_nickname.charAt(0) || '?',
    avatarTone: toneFor(item.author_nickname || item.public_id),
  };
}
