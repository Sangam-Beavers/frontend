export const DOC_TYPES = ['거소증명서', '급여명세서', '고용계약서'] as const;

export type DocType = (typeof DOC_TYPES)[number];
