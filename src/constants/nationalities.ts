// 회원가입/Google 추가정보: 국적 선택지 (이슈 #188)
// 한국 / 베트남 / 필리핀 / 미국 / 기타 5개. 표시 순서 = 배열 순서.
// 백엔드 정본은 ISO 3166-1 alpha-2 코드(members.nationality, admin 통계 매핑 기준).
//   → label(한글)이 아니라 code를 전송한다. (이전엔 한글 라벨을 그대로 보내서 "KR" vs "한국"으로
//     같은 나라가 통계에서 두 그룹으로 갈리는 버그가 있었음.)
// "기타"는 ISO 코드가 없어 관례상 'ETC'로 보낸다(백엔드/통계 매핑과 합의 필요).
export interface Nationality {
  code: string;
  label: string;
}

export const NATIONALITIES: readonly Nationality[] = [
  { code: 'KR', label: '한국' },
  { code: 'VN', label: '베트남' },
  { code: 'PH', label: '필리핀' },
  { code: 'US', label: '미국' },
  { code: 'ETC', label: '기타' },
] as const;
