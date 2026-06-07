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
  AccountItem,
  AccountListResponse,
  SupportedBank,
  SupportedBankListResponse,
  AccountHolderResponse,
  VerifyAccountRequest,
  VerifyAccountResponse,
  RegisterAccountRequest,
  ChargeRequest,
  ChargeResponse,
  WalletBalanceWithKrwItem,
  WalletMeResponse,
  ExchangeRateItem,
  ExchangeRateWidgetResponse,
  TransactionTypeCode,
  TransactionStatusCode,
  TransactionDirection,
  TransactionHistoryItem,
  TransactionListResponse,
  TransferReceiptResponse,
  TransferTypeCode,
  ValidateScheduledRequest,
  ValidateScheduledResponse,
  CreateScheduledTransferRequest,
  ScheduledTransferResponse,
  ScheduledTransferHistoryItem,
  ScheduledTransferHistoryResponse,
} from './wallet';
export { documentApi } from './document';
export type {
  DocumentStatusCode,
  ProcessingStatusCode,
  RiskLevelCode,
  SubmitDocumentRequest,
  SubmissionResponse,
  DocumentStatusResponse,
  DeductionItem,
  WageSummary,
  RiskItem,
  DocumentResultResponse,
  DocumentSummaryItem,
  DocumentListResponse,
} from './document';
// AnalysisDocumentType은 화면 라벨 매핑과 함께 constants/docTypes.ts가 SSOT.
export type { AnalysisDocumentType } from '@/constants/docTypes';
