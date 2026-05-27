export const DOC_TYPES = ['근로계약서', '급여명세서', '고용계약서'] as const;

export type DocType = (typeof DOC_TYPES)[number];
