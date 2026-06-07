// 플랫폼 지원 국적 — 4개 확정 (2026-06-07 결정)
// 신분증 인증 4개국(이슈 #108) 및 통화 4개(KRW/USD/PHP/VND)와 1:1 정렬.
// 확장 시 결정문(심규보/결정-국적언어-스코프-확정.md) 절차 따를 것.
export const NATIONALITIES = ['한국', '미국', '베트남', '필리핀'] as const;

/** 국적 라벨 → ISO 3166-1 alpha-2 코드 매핑. 백엔드 전송용. */
export const NATIONALITY_LABEL_TO_CODE: Record<(typeof NATIONALITIES)[number], string> = {
  한국: 'KR',
  미국: 'US',
  베트남: 'VN',
  필리핀: 'PH',
};

/** ISO 3166-1 alpha-2 코드 → 한국어 라벨. 백엔드 응답 표시용. */
export const NATIONALITY_CODE_TO_LABEL: Record<string, string> = {
  KR: '한국',
  US: '미국',
  VN: '베트남',
  PH: '필리핀',
};
