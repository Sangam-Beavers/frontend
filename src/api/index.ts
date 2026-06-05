/**
 * API 모듈 진입점. 호출 측은 `import { communityApi } from '@/api'`로 사용.
 *
 * client.ts는 axios 인스턴스·interceptor·ApiException 정의. 도메인별 함수는 *.ts.
 */

export { apiClient, ApiException } from './client';
export type { ApiSuccess, ApiError } from './client';

export { communityApi } from './community';
export { memberApi } from './member';
export { walletApi } from './wallet';
export type {
  TransferPinBody,
  ExchangeTypeCode,
  SupportedCurrency,
  SupportedCurrenciesResponse,
  ExchangeQuoteRequest,
  ExchangeQuoteResponse,
  ExchangeExecuteRequest,
  ExchangeResponse,
  ExchangeListResponse,
  WalletStatusCode,
  WalletBalanceItem,
  WalletBalancesResponse,
} from './wallet';
export { documentApi } from './document';
export type {
  AnalysisDocumentType,
  DocumentStatus,
  ProcessingStatus,
  RiskLevel,
  SubmitRequest,
  SubmissionResponse,
  DocumentStatusResponse,
  DeductionDto,
  WageSummaryDto,
  RiskItemDto,
  DocumentResultResponse,
} from './document';
