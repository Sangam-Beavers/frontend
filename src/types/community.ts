export type CommunityCategory = 'all' | 'residence' | 'life' | 'job' | 'visa' | 'country' | 'free';

export type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad' | 'purple' | 'gold' | 'default';

export interface FeedPostItem {
  id: string;
  title: string;
  meta: string;
  body: string;
  /** 작성자별 고정 아바타 시드(닉네임). 사진 미설정 시 identicon 생성에 사용. */
  avatarSeed: string;
  /** 작성자 프로필 사진 URL. 있으면 사진, 없으면(null) identicon. */
  avatarImageUrl: string | null;
  /**
   * 아바타 테두리 톤 — 작성자 신뢰등급(trust_grade) 매핑 결과(이슈 #175).
   * VERIFIED → 'good'(초록 실선), NEWCOMER·누락 → 'default'(회색 점선). 미지정도 회색 폴백.
   */
  avatarTone?: AvatarTone;
  /** 작성자 아바타 색조 회전 각도(0~359°). 마이페이지 '색깔 변경' 저장값 — 아바타 hue-rotate 적용. 미설정 시 0. */
  avatarHue?: number;
  /**
   * 작성 언어 코드. 카드별 "Translate" 버튼이 `i18n.language`와 비교해 같으면 숨긴다.
   * 백엔드가 응답에 안 채워주면 undefined — 그땐 가드 못해 버튼 항상 노출(안전 fallback).
   */
  language?: string;
}

export interface CommunityTabItem {
  category: CommunityCategory;
  label: string;
  path: string;
}

export interface PostDetail {
  id: string;
  authorName: string;
  authorVerified: boolean;
  authorMeta: string;
  authorAvatarInitial: string;
  title: string;
  body: string;
  hasImage: boolean;
  likeCount: number;
}

export interface PostComment {
  id: string;
  authorName: string;
  authorVerified: boolean;
  avatarInitial: string;
  text: string;
  createdAt: string;
}

export type WriteCategory = 'residence' | 'life' | 'job' | 'free';

import { ROUTES } from '@/constants/routes';

export const COMMUNITY_TABS: CommunityTabItem[] = [
  { category: 'all', label: '전체', path: ROUTES.COMMUNITY },
  { category: 'residence', label: '거주', path: ROUTES.COMMUNITY_RESIDENCE },
  { category: 'life', label: '생활', path: ROUTES.COMMUNITY_LIFE },
  { category: 'job', label: '취업', path: ROUTES.COMMUNITY_JOB },
  { category: 'visa', label: '비자', path: ROUTES.COMMUNITY_VISA },
  { category: 'country', label: '국가별 정보', path: ROUTES.COMMUNITY_COUNTRY },
  { category: 'free', label: '자유게시판', path: ROUTES.COMMUNITY_FREE },
];
