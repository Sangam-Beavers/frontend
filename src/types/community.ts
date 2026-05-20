export type CommunityCategory = 'all' | 'residence' | 'life' | 'job' | 'free';

export type AvatarTone = 'best' | 'good' | 'mid' | 'warn' | 'bad' | 'purple' | 'default';

export interface FeedPostItem {
  id: string;
  title: string;
  meta: string;
  body: string;
  avatarInitial: string;
  avatarTone: AvatarTone;
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

export const COMMUNITY_TABS: CommunityTabItem[] = [
  { category: 'all', label: '전체', path: '/community' },
  { category: 'residence', label: '거주', path: '/community/residence' },
  { category: 'life', label: '생활', path: '/community/life' },
  { category: 'job', label: '취업', path: '/community/job' },
  { category: 'free', label: '자유게시판', path: '/community/free' },
];
