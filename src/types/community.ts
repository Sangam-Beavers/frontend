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

export const COMMUNITY_TABS: CommunityTabItem[] = [
  { category: 'all', label: '전체', path: '/community' },
  { category: 'residence', label: '거주', path: '/community/residence' },
  { category: 'life', label: '생활', path: '/community/life' },
  { category: 'job', label: '취업', path: '/community/job' },
  { category: 'free', label: '자유게시판', path: '/community/free' },
];
