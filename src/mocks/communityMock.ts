import type { FeedPostItem, PostComment, PostDetail } from '@/types/community';

export const COMMUNITY_POSTS_ALL_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'roommate',
      title: '기숙사 룸메이트 후기 공유',
      meta: 'Linh · 인증 · 거주 · 댓글 12 · 좋아요 38',
      body: '청소 규칙과 공과금 분담은 계약 전에 꼭 확인하세요.',
      avatarInitial: 'L',
      avatarTone: 'best',
    },
    {
      id: 'pho',
      title: '서울에서 베트남 음식 맛집 찾았어요',
      meta: 'Minh · 생활 · 번역 보기',
      body: '고향 맛이 나는 쌀국수집 공유합니다.',
      avatarInitial: 'M',
      avatarTone: 'good',
    },
    {
      id: 'logistics-interview',
      title: '물류센터 면접 후기와 준비물',
      meta: 'Tara · 취업 · 댓글 8',
      body: '면접 질문, 근무시간, 통근버스 정보를 정리했어요.',
      avatarInitial: 'T',
      avatarTone: 'mid',
    },
  ] as FeedPostItem[],
};

export const COMMUNITY_POSTS_RESIDENCE_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'guro-room',
      title: '구로 룸메이트 구합니다',
      meta: '생활온도 매우 좋음 · 월 35만원 · 즉시 입주',
      body: '여성 전용, 역에서 8분 거리. 계약 전 직접 확인 가능해요.',
      avatarInitial: 'R',
      avatarTone: 'best',
    },
    {
      id: 'dorm-deal',
      title: '기숙사 급매 정보 공유',
      meta: '부동산 · 보증금 낮음 · 댓글 5',
      body: '공장 근처 기숙사 자리가 생겨서 공유합니다.',
      avatarInitial: 'H',
      avatarTone: 'good',
    },
  ] as FeedPostItem[],
};

export const COMMUNITY_POSTS_LIFE_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'ansan-mart',
      title: '안산 베트남 식재료 마트 추천',
      meta: '생활 · 좋아요 24',
      body: '쌀국수 재료와 향신료를 저렴하게 살 수 있어요.',
      avatarInitial: 'M',
      avatarTone: 'mid',
    },
    {
      id: 'futsal',
      title: '주말 풋살 동호회 모집',
      meta: '동호회 · 중국어/한국어 가능',
      body: '처음 오는 분도 환영합니다. 매주 일요일 오후 3시.',
      avatarInitial: 'C',
      avatarTone: 'good',
    },
  ] as FeedPostItem[],
};

export const COMMUNITY_POSTS_JOB_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'manufacturing',
      title: '기숙사 제공 제조업 공고 모음',
      meta: '관리자 · 잡코리아 연동 · 광고',
      body: '야간수당, 통근버스, 비자 가능 여부를 확인해보세요.',
      avatarInitial: 'A',
      avatarTone: 'best',
    },
  ] as FeedPostItem[],
};

export const COMMUNITY_POSTS_FREE_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'winter-clothes',
      title: '한국 겨울 옷 어디서 사면 좋나요?',
      meta: '자유게시판 · 댓글 14',
      body: '처음 맞는 겨울이라 따뜻한 옷 추천 부탁해요.',
      avatarInitial: 'S',
      avatarTone: 'purple',
    },
    {
      id: 'topik-study',
      title: '오늘 TOPIK 공부 같이 할 사람?',
      meta: '자유게시판 · 좋아요 9',
      body: '퇴근 후 온라인으로 같이 공부해요.',
      avatarInitial: 'P',
      avatarTone: 'mid',
    },
  ] as FeedPostItem[],
};

export const POST_DETAIL_MOCK = {
  isSuccess: true,
  code: '200',
  result: {
    id: 'roommate',
    authorName: 'Linh',
    authorVerified: true,
    authorMeta: '친절한 온도: 매우 좋음 · 베트남어',
    authorAvatarInitial: 'L',
    title: '기숙사 룸메이트 후기 공유',
    body: '같이 살 때 청소 규칙을 먼저 정하면 훨씬 편해요. 계약 전에 보증금과 공과금 분담도 꼭 확인하세요.',
    hasImage: true,
    likeCount: 38,
  } as PostDetail,
};

export const POST_COMMENTS_MOCK = {
  isSuccess: true,
  code: '200',
  result: [
    {
      id: 'c1',
      authorName: 'Minh',
      authorVerified: true,
      avatarInitial: 'M',
      text: '좋은 정보 감사합니다!',
      createdAt: '2021.04.13. 09:39',
    },
    {
      id: 'c2',
      authorName: 'Tara',
      authorVerified: false,
      avatarInitial: 'T',
      text: '번역 보기로 이해됐어요.',
      createdAt: '2021.04.13. 09:40',
    },
    {
      id: 'c3',
      authorName: '현지탐방러',
      authorVerified: false,
      avatarInitial: '현',
      text: '좋은 후기예요.',
      createdAt: '2021.04.13. 09:39',
    },
  ] as PostComment[],
};
