// 변호사 상담(광고/홍보) 페이지 도메인 타입.
// 백엔드 연동 없이 프론트에서 하드코딩으로 노출하는 광고 목록용(이슈 #221).

/** 변호사 전문 분야. 탭 필터 및 카드 뱃지에 사용한다. */
export type LawyerCategory = 'labor' | 'visa' | 'contract' | 'wage' | 'accident';

/** 탭 키 — 'all'(전체) + 분야들. */
export type LawyerTabKey = 'all' | LawyerCategory;

export interface Lawyer {
  id: string;
  name: string;
  /** 대표 분야 — 카드 뱃지에 표시. */
  category: LawyerCategory;
  /** 탭 필터 매칭용 분야 목록(대표 분야 포함, 부가 분야까지). */
  categories: LawyerCategory[];
  /** 해시태그(예: '부당해고'). '#'는 렌더링 시 붙인다. */
  tags: string[];
  phone: string;
  /** 지역(예: '서울 강남구'). */
  location: string;
  /** 상담 가능 언어(예: ['한국어', '영어']). */
  languages: string[];
  /**
   * 프로필 이미지 경로. public 폴더 기준 절대경로(`/lawyers/<id>.jpg`).
   * 파일이 없으면 카드에서 이름 첫 글자 fallback 아바타로 대체된다.
   */
  photoUrl: string;
  /** 실시간 상담 가능 여부 — true면 초록 점 표시. */
  online: boolean;
}

export interface LawyerTab {
  key: LawyerTabKey;
  label: string;
}

/** 탭 목록(전체 / 노동 / 비자 / 계약 / 임금체불 / 산재). */
export const LAWYER_TABS: LawyerTab[] = [
  { key: 'all', label: '전체' },
  { key: 'labor', label: '노동' },
  { key: 'visa', label: '비자' },
  { key: 'contract', label: '계약' },
  { key: 'wage', label: '임금체불' },
  { key: 'accident', label: '산재' },
];

/** 분야 → 카드 뱃지 라벨. */
export const LAWYER_CATEGORY_LABEL: Record<LawyerCategory, string> = {
  labor: '노동',
  visa: '비자',
  contract: '계약',
  wage: '임금체불',
  accident: '산재',
};
