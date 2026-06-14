import type { Lawyer } from '@/types/lawyer';

/**
 * 변호사 광고 목록 — 하드코딩 mock(이슈 #221).
 * 프로필 이미지는 public/lawyers/<id>.jpg 에 두면 자동으로 표시된다(없으면 이름 첫 글자 아바타).
 */
export const LAWYERS_MOCK: Lawyer[] = [
  {
    id: 'kim-taehoon',
    name: '김태훈',
    category: 'labor',
    categories: ['labor', 'wage'],
    tags: ['부당해고', '임금체불', '근로계약', '산업안전'],
    phone: '02-3456-1201',
    location: '서울 강남구',
    languages: ['한국어', '영어'],
    photoUrl: '/lawyers/kim-taehoon.png',
    online: true,
  },
  {
    id: 'park-minseo',
    name: '박민서',
    category: 'visa',
    categories: ['visa'],
    tags: ['E-9 비자', '체류연장', '비자변경', '불법체류'],
    phone: '02-5567-2033',
    location: '서울 종로구',
    languages: ['한국어', '중국어'],
    photoUrl: '/lawyers/park-minseo.png',
    online: true,
  },
  {
    id: 'lee-soohyun',
    name: '이수현',
    category: 'contract',
    categories: ['contract'],
    tags: ['근로계약서', '계약 해지', '계약 분쟁', '합의서'],
    phone: '031-778-9812',
    location: '경기 수원시',
    languages: ['한국어', '베트남어'],
    photoUrl: '/lawyers/lee-soohyun.png',
    online: true,
  },
  {
    id: 'jung-yehwa',
    name: '정예화',
    category: 'accident',
    categories: ['accident', 'wage'],
    tags: ['산업재해', '요양신청', '보상청구', '장해등급'],
    phone: '051-234-7788',
    location: '부산 해운대구',
    languages: ['한국어', '태국어'],
    photoUrl: '/lawyers/jung-yehwa.png',
    online: true,
  },
];
