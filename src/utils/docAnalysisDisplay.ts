import type { DocumentSummaryItem } from '@/api/document';
import type { RiskLevelCode } from '@/api/document';
import { ENUM_TO_DOC_TYPE } from '@/constants/docTypes';

/**
 * 문서 분석 목록 항목 표시용 헬퍼 — Select(최근 분석 내역)·History 페이지 공용.
 * 백엔드 enum/ISO 시각을 화면 문구로 변환만 한다 (로직 없음).
 */

/** 종합 위험 등급 → 화면 라벨. */
const RISK_LABEL: Record<RiskLevelCode, string> = {
  HIGH: '위험',
  MEDIUM: '주의 필요',
  LOW: '양호',
};

/** 문서 종류 enum → 한글 라벨 (미지의 값은 원문 그대로). */
export function docTypeLabel(item: DocumentSummaryItem): string {
  return ENUM_TO_DOC_TYPE[item.analysis_document_type] ?? item.analysis_document_type;
}

/**
 * 상태 pill 문구 — 완료면 위험 등급(없으면 '완료'), 그 외 진행/실패 상태.
 */
export function docStatusLabel(item: DocumentSummaryItem): string {
  if (item.status === 'ANALYZING') return '분석 중';
  if (item.status === 'FAILED') return '실패';
  return item.overall_risk_level ? RISK_LABEL[item.overall_risk_level] : '완료';
}

/** ISO 8601 UTC Z → "2026.05.13" (사용자 로컬 기준). */
export function docDateLabel(isoUtc: string): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}.${mm}.${dd}`;
}
