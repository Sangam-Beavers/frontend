// 챗봇 컴포넌트 배럴 — DocAnalysisResultPage 등에서 한 줄로 import.
//
// 진입점은 인라인 버튼(ChatbotEntryButton) 하나로 통일됐고, 분석 결과 기반 컨텍스트
// 진입은 시트 안의 SuggestedTopics가 담당한다.
//
// (AskMoreChip / ChatbotFab은 시안 반복 과정에서 사용처에서 제거됐지만 파일은 유지)
export { default as ChatbotEntryButton } from './ChatbotEntryButton';
export { default as ChatbotSheet } from './ChatbotSheet';
