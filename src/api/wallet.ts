import { apiClient } from './client';

/**
 * wallet-service API 호출 함수 모음 (잔액·계좌·충전·송금·정기송금·환전).
 *
 * - 모두 인증 필요(JWT) — interceptor가 토큰 자동 부착.
 * - 응답 타입은 인라인 snake_case로 작성한다 (자동 생성 타입은 SpringDoc 기본이 camelCase라
 *   실제 응답과 미스매치 — README.md §2 "snake_case ↔ camelCase 불일치" 항 참고).
 */

// ---------- Request / Response 타입 (인라인, 백엔드 명세 기준 snake_case) ----------

export interface TransferPinBody {
  /** 송금 PIN — 숫자 6자리 문자열(예: "123456"). 필드명은 password 아님(별도 PIN 재설계 — 백엔드 #127). */
  pin: string;
}

/** 환전 유형. EXCHANGE = KRW→외화, RE_EXCHANGE = 외화→KRW (백엔드 ExchangeType enum SSOT). */
export type ExchangeTypeCode = 'EXCHANGE' | 'RE_EXCHANGE';

/** 지원 통화 한 건 (백엔드 SupportedCurrenciesResponse.CurrencyInfo). */
export interface SupportedCurrency {
  /** ISO 4217 코드 (예: "USD", "KRW", "VND", "PHP"). */
  currency_code: string;
  /** 표시명 (예: "US Dollar"). */
  currency_name: string;
  /** 기호 (예: "$", "₩"). */
  currency_symbol: string;
}

export interface SupportedCurrenciesResponse {
  currencies: SupportedCurrency[];
}

/** 환전 견적 요청 body. 금액은 string 십진수(예: "100000.0000"). */
export interface ExchangeQuoteRequest {
  exchange_type: ExchangeTypeCode;
  from_currency_code: string;
  to_currency_code: string;
  amount: string;
}

/** 환전 견적 응답. 5분 유효, expires_at은 ISO 8601 UTC Z. */
export interface ExchangeQuoteResponse {
  quote_public_id: string;
  exchange_rate: string;
  fee: string;
  fee_currency_code: string;
  receive_amount: string;
  receive_currency_code: string;
  expires_at: string;
}

/** 환전 실행 요청 body. quote_public_id만 전송(환율·금액은 견적에 확정돼 있음). */
export interface ExchangeExecuteRequest {
  quote_public_id: string;
}

/** 환전 실행/내역 단건 응답 (백엔드 ExchangeResponse — 실행 201 / 내역 200 동일 구조). */
export interface ExchangeResponse {
  public_id: string;
  exchange_type: ExchangeTypeCode;
  from_currency_code: string;
  to_currency_code: string;
  amount: string;
  exchange_rate: string;
  fee: string;
  receive_amount: string;
  receive_currency_code: string;
  status: string;
  exchanged_at: string;
}

/** 환전 내역 목록 응답 — 페이지 메타 + ExchangeResponse 배열 (백엔드 ExchangeListResponse §10). */
export interface ExchangeListResponse {
  exchanges: ExchangeResponse[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/**
 * 송금 확인증 응답 (백엔드 TransferReceiptResponse — api-spec §7-1).
 *
 * INTERNAL_TRANSFER / REMITTANCE 두 유형의 완료 송금 한 건의 확인증.
 * - INTERNAL: `bank_name`/`account_number`는 null (앱 사용자 송금이라 외부 계좌 정보 없음)
 * - REMITTANCE: `bank_name`/`account_number` 채워짐 (해외 송금 수취 계좌)
 * - 1·2단계 same-currency: `exchange_rate` null, `receive_amount` === `amount`
 * - 3단계+ 다통화: `exchange_rate`/`receive_currency_code` 다른 값
 */
export interface TransferReceiptResponse {
  public_id: string;
  /** 송금인 본명. MemberClient 장애 시 null. */
  sender_name: string | null;
  /** 수취인 본명. INTERNAL=수신자 본명(장애 시 null), REMITTANCE=등록 시 예금주(컬럼 추가 전 구 계좌면 null). */
  receiver_name: string | null;
  /** 수취 은행명. REMITTANCE만, INTERNAL은 null. */
  bank_name: string | null;
  /** 수취 계좌번호(마스킹 앞3+별표+뒤2). REMITTANCE만, INTERNAL은 null. */
  account_number: string | null;
  /** 송금 금액 — string 소수 4자리. */
  amount: string;
  /** 출금 통화 코드. */
  currency_code: string;
  /** 수수료 — string 소수 4자리. */
  fee: string;
  /** 적용 환율 — same-currency는 null, 다통화부터 값. */
  exchange_rate: string | null;
  /** 수취 금액 — 1·2단계는 amount와 동일. */
  receive_amount: string;
  /** 수취 통화 코드. */
  receive_currency_code: string;
  /** 거래 상태 (COMPLETED/PENDING/PROCESSING/FAILED/CANCELLED). */
  status: string;
  /** 송금 시각 (ISO 8601 UTC Z). */
  created_at: string;
}

/**
 * 거래 유형 (백엔드 TransactionType enum SSOT).
 * - CHARGE: 외부 은행계좌에서 전자지갑으로 충전
 * - INTERNAL_TRANSFER: 앱 사용자 간 송금 (송신/수신 모두 해당)
 * - REMITTANCE: 해외 송금 (외부 은행계좌로)
 * - EXCHANGE: 환전 (지갑 내 통화 변환)
 */
export type TransactionTypeCode = 'CHARGE' | 'INTERNAL_TRANSFER' | 'REMITTANCE' | 'EXCHANGE';

/** 거래 상태 (백엔드 TransactionStatus enum SSOT). */
export type TransactionStatusCode = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

/**
 * 본인 기준 거래 방향. OUT = 본인이 송신자(출금), IN = 본인이 수신자(입금).
 * CHARGE/REMITTANCE/EXCHANGE는 항상 OUT, INTERNAL_TRANSFER만 OUT/IN 분기.
 */
export type TransactionDirection = 'OUT' | 'IN';

/**
 * 거래내역 단건 항목 (백엔드 TransactionHistoryItemResponse — api-spec §3).
 *
 * 모든 유형(CHARGE/INTERNAL_TRANSFER/REMITTANCE/EXCHANGE)을 하나의 형태로 표현.
 * 금액은 string(소수 4자리), 식별자는 public_id(UUID), 시각은 ISO 8601 UTC Z.
 */
export interface TransactionHistoryItem {
  public_id: string;
  type: TransactionTypeCode;
  direction: TransactionDirection;
  status: TransactionStatusCode;
  /** 거래(출금) 금액 — string 소수 4자리. */
  amount: string;
  currency_code: string;
  /** 수수료 — string 소수 4자리. 무료면 "0.0000". */
  fee: string;
  /** 수령액 — 환전·송금만, 그 외 null. */
  receive_amount: string | null;
  /** 수령 통화 코드 — 환전·송금만. */
  receive_currency_code: string | null;
  /** 수취인 이름 — 송금만. */
  receiver_name: string | null;
  /** 거래 시각 (ISO 8601 UTC Z). */
  created_at: string;
}

/** 거래내역 목록 응답 — 페이지 메타 + transactions 배열 (백엔드 TransactionListResponse). */
export interface TransactionListResponse {
  transactions: TransactionHistoryItem[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 지갑 상태. */
export type WalletStatusCode = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

/** POST /api/v1/wallets 응답 data (이슈 #108/#152 — 멱등 지갑 생성). */
export interface WalletCreateResult {
  wallet_public_id: string;
  status: WalletStatusCode;
  created_at: string;
}

/** 통화별 잔액 한 건 (백엔드 WalletBalanceResponse.BalanceItem). */
export interface WalletBalanceItem {
  /** ISO 4217 코드 (예: "KRW", "USD"). 백엔드 CurrencyType enum 4종(KRW/USD/PHP/VND). */
  currency_code: string;
  /** 잔액 — 소수 4자리 고정 string ("1530000.0000"). Number 변환 후 표시. */
  balance: string;
}

/** 전자지갑 잔액 조회 응답 (GET /wallets/me/balances). */
export interface WalletBalancesResponse {
  wallet_public_id: string;
  status: WalletStatusCode;
  balances: WalletBalanceItem[];
  /** 잔액 최종 변경 시각 (ISO 8601 UTC Z). */
  updated_at: string;
}

/** 등록된 계좌 한 건 (백엔드 AccountResponse). 실제 응답은 snake_case(Jackson 전역 설정). */
export interface AccountItem {
  /** 계좌 식별자(UUID) — 주 계좌 지정·해제 등 후속 API의 path variable. */
  account_public_id: string;
  /** 은행 코드 (예: "004"). */
  bank_code: string;
  /** 은행명 (예: "KB국민은행"). */
  bank_name: string;
  /** 마스킹된 계좌번호 — 앞 3 + 끝 2만 노출 (예: "123*********34"). */
  account_number_masked: string;
  /** 주 계좌 여부. */
  is_primary: boolean;
  /** 가상계좌(앱 내부 발급) 여부. */
  is_virtual: boolean;
  /** 외부 은행 인증 완료 여부. */
  is_verified: boolean;
  /** 계좌 등록 시각 (ISO 8601 UTC Z). */
  created_at: string;
}

/** 등록된 내 계좌 목록 응답 (GET /accounts) — 주 계좌 우선, 최신 등록순. */
export interface AccountListResponse {
  /** 활성 계좌 목록. 등록된 계좌가 없으면 빈 배열(404 아님). */
  accounts: AccountItem[];
}

/** 지원 은행 한 건 (백엔드 SupportedBankResponse). 계좌 등록 시 선택 가능한 은행. */
export interface SupportedBank {
  /** 은행 코드 (예: "004"). 예금주 조회·계좌 등록 시 식별자로 사용. */
  bank_code: string;
  /** 은행명 (예: "KB국민은행"). */
  bank_name: string;
}

/** 추가 지원 은행 목록 응답 (GET /accounts/supported-banks) — 이름 가나다순. */
export interface SupportedBankListResponse {
  banks: SupportedBank[];
}

/** 예금주 실명 조회 응답 (GET /accounts/holder). */
export interface AccountHolderResponse {
  /** Mock 은행에서 조회된 예금주 실명 (예: "홍길동"). */
  account_holder_name: string;
}

/** 계좌 연결+자동이체 인증 요청 body. 실제 요청은 snake_case(Jackson 전역). */
export interface VerifyAccountRequest {
  bank_code: string;
  /** 하이픈 없는 계좌번호 숫자 문자열. */
  account_number: string;
  /** 예금주명 — GET /accounts/holder로 확인한 값. */
  holder_name: string;
}

/** 계좌 인증 응답 — register 단계에 그대로 넘길 외부(Mock) 은행 토큰. */
export interface VerifyAccountResponse {
  account_token: string;
}

/** 계좌 등록 최종 완료 요청 body. account_token은 verify 응답값. */
export interface RegisterAccountRequest {
  bank_code: string;
  account_number: string;
  /** verify 단계에서 발급받은 account_token. */
  account_token: string;
  holder_name: string;
}

/** 충전 요청 body. amount는 KRW 십진수 string("300000"). 0 초과. */
export interface ChargeRequest {
  amount: string;
}

/** 충전 실행 응답 (POST /accounts/{id}/charge). 실제 응답은 snake_case. */
export interface ChargeResponse {
  /** 충전 거래 식별자(UUID). */
  public_id: string;
  /** 출금 계좌 식별자(UUID). */
  account_public_id: string;
  /** 충전 금액 — string 소수 4자리. */
  amount: string;
  /** 통화 코드(KRW 고정). */
  currency_code: string;
  /** 충전 후 지갑 잔액 — string 소수 4자리. */
  wallet_balance: string;
  /** 거래 상태(예: "COMPLETED"). */
  status: string;
  created_at: string;
}

/** 통화별 잔액 + 환율 + 원화 환산액 (백엔드 WalletMeResponse.BalanceWithKrwItem). */
export interface WalletBalanceWithKrwItem {
  currency_code: string;
  /** 해당 통화 잔액 (소수 4자리 string). */
  balance: string;
  /** "1 외화→KRW" 환율 (소수 4자리 string). KRW는 "1". */
  exchange_rate: string;
  /** 해당 통화 원화 환산액 (소수 4자리 string). */
  balance_in_krw: string;
}

/** 전자지갑 + 원화 환산 총액 응답 (GET /wallets/me). */
export interface WalletMeResponse {
  wallet_public_id: string;
  status: WalletStatusCode;
  /** 전체 보유 통화의 원화 환산 합계 (소수 4자리 string, 예: "1888500.0000"). */
  total_balance_in_krw: string;
  balances: WalletBalanceWithKrwItem[];
  /** 잔액·환산 기준 시각 (ISO 8601 UTC Z). */
  updated_at: string;
}

/** 환율 위젯의 통화별 1건 (백엔드 ExchangeRateWidgetResponse.RateItem). */
export interface ExchangeRateItem {
  currency_code: string;
  /** 한국어 통화명 (예: "미국 달러"). */
  currency_name: string;
  /** 기호 (예: "$"). */
  currency_symbol: string;
  /** "1 외화→KRW" 환율 (소수 4자리 string). */
  exchange_rate: string;
  /** 전일 대비 등락률 (%). 표시 전용 number. 직전 값 없으면 0. */
  change_rate: number;
  /** 환율 기준 시각 (ISO 8601 UTC Z). */
  updated_at: string;
}

/** 주요 통화 환율 위젯 응답 (GET /wallets/exchange-rates). */
export interface ExchangeRateWidgetResponse {
  /** 기준 통화 — 항상 "KRW" (1 외화→KRW 환산 기준). */
  base_currency_code: string;
  rates: ExchangeRateItem[];
}

/** 송금 지원 통화 한 건 (백엔드 transaction/SupportedCurrenciesResponse.CurrencyItem).
 *  ⚠️ 환전 도메인 SupportedCurrency와 필드명 다름 (code/name/symbol). */
export interface TransferSupportedCurrency {
  /** ISO 4217 코드 (예: "KRW", "USD"). */
  code: string;
  /** 영문 표시명 (예: "Korean Won"). */
  name: string;
  /** 기호 (예: "₩", "$"). */
  symbol: string;
}

/** 송금 지원 통화 목록 응답 (GET /transfers/supported-currencies). */
export interface TransferSupportedCurrenciesResponse {
  currencies: TransferSupportedCurrency[];
}

/** 최근 송금한 앱 사용자 한 건 (백엔드 RecentRecipientsResponse.RecipientItem). */
export interface RecentRecipientItem {
  /** 수신자 회원 식별자(UUID) — 검증/송금 API 호출 시 사용. */
  member_public_id: string;
  /** 수신자 닉네임. */
  nickname: string;
  /** 국적 코드(ISO 3166-1 alpha-2, 예: "VN", "KR"). */
  nationality: string;
  /** 회원 인증 배지 여부. */
  is_verified: boolean;
  /** 가장 최근 송금의 통화 코드 (KRW/USD/PHP/VND 중 1). */
  last_currency_code: string;
  /** 가장 최근 송금 시각 (ISO 8601 UTC Z). */
  last_transferred_at: string;
}

/** 최근 송금 수신자 목록 응답 (GET /transfers/recent-recipients/members). */
export interface RecentRecipientsResponse {
  receivers: RecentRecipientItem[];
}

/** 앱 사용자 유효성 검증 응답 (백엔드 ValidateMemberResponse).
 *  receiver_public_id는 송금 실행 API 호출 시 사용 — 검증 성공 시 state에 보관. */
export interface ValidateMemberResponse {
  receiver_public_id: string;
  nickname: string;
  is_verified: boolean;
}

/** 송금 방식 (백엔드 TransferType enum). 정기송금에도 동일 enum 사용. */
export type TransferTypeCode = 'INTERNAL_TRANSFER' | 'REMITTANCE';

/**
 * 송금 실행 요청 공통 필드 — discriminated union의 base (api-spec §6).
 *
 * 1·2단계 same-currency 강제 — currency_code !== receive_currency_code면 TRANSFER4005.
 * 다통화는 3단계로 이연.
 */
interface TransferExecuteCommonFields {
  /** 송금 금액 — string 십진수, 양수, 정수부 ≤14자리·소수점 ≤4자리. */
  amount: string;
  currency_code: string;
  /** 수취 통화 — 1·2단계는 currency_code와 동일해야 함(다르면 TRANSFER4005). */
  receive_currency_code: string;
  /** 메모(선택, 최대 255자). */
  memo?: string | null;
}

/**
 * 송금 실행 요청 (POST /api/v1/transfers).
 *
 * transfer_type별로 필수 식별자가 다른 점을 타입으로 강제:
 * - INTERNAL_TRANSFER → receiver_public_id 필수, bank_account_public_id 금지
 * - REMITTANCE        → bank_account_public_id 필수, receiver_public_id 금지
 *
 * 잘못된 조합이 컴파일 단계에서 차단되므로 호출부 런타임 400(COMMON4001)을 사전 방지한다.
 * (ValidateScheduledRequest와 동일 패턴 — CodeRabbit 리뷰 정합)
 */
export type TransferExecuteRequest =
  | ({
      transfer_type: 'INTERNAL_TRANSFER';
      /** INTERNAL_TRANSFER 필수 — 수신자 회원 UUID. */
      receiver_public_id: string;
      bank_account_public_id?: never;
    } & TransferExecuteCommonFields)
  | ({
      transfer_type: 'REMITTANCE';
      /** REMITTANCE 필수 — 수신 은행 계좌 UUID. */
      bank_account_public_id: string;
      receiver_public_id?: never;
    } & TransferExecuteCommonFields);

/**
 * 송금 실행 응답 (201) — 거래 1건 스냅샷 (백엔드 TransferExecuteResponse, api-spec §6).
 *
 * 1단계(same-currency)에서 exchange_rate는 항상 null이며 receive_amount는 amount와 동일.
 */
export interface TransferExecuteResponse {
  public_id: string;
  transfer_type: TransferTypeCode;
  amount: string;
  currency_code: string;
  fee: string;
  /** 1·2단계는 항상 null (same-currency). */
  exchange_rate: string | null;
  receive_amount: string;
  receive_currency_code: string;
  /** COMPLETED (현 단계에서 즉시 완료). */
  status: string;
  /** ISO 8601 UTC Z. */
  created_at: string;
}

/**
 * 정기 송금 공통 필드 — discriminated union의 base.
 *
 * 1·2단계는 same-currency 강제 — currency_code !== receive_currency_code면 is_valid=false + reason.
 */
interface ScheduledTransferCommonFields {
  /** 회차당 송금액 — string 십진수, 양수. */
  amount: string;
  currency_code: string;
  receive_currency_code: string;
}

/**
 * 정기 송금 대상 유효성 검증 요청 (POST /transfers/scheduled/validate).
 *
 * transfer_type별로 필수 식별자가 다른 점을 타입으로 강제 (CodeRabbit 리뷰 반영):
 * - INTERNAL_TRANSFER → receiver_public_id 필수, bank_account_public_id 금지
 * - REMITTANCE        → bank_account_public_id 필수, receiver_public_id 금지
 *
 * 잘못된 조합이 컴파일 단계에서 차단되므로 호출부 런타임 400(COMMON4001)을 사전 방지한다.
 */
export type ValidateScheduledRequest =
  | ({
      transfer_type: 'INTERNAL_TRANSFER';
      /** INTERNAL_TRANSFER 필수 — 수신자 회원 UUID. */
      receiver_public_id: string;
      bank_account_public_id?: never;
    } & ScheduledTransferCommonFields)
  | ({
      transfer_type: 'REMITTANCE';
      /** REMITTANCE 필수 — 수신 은행 계좌 UUID. */
      bank_account_public_id: string;
      receiver_public_id?: never;
    } & ScheduledTransferCommonFields);

/** 검증 결과 — 통과 여부 + 미통과 사유(통과면 null). */
export interface ValidateScheduledResponse {
  is_valid: boolean;
  reason: string | null;
}

/**
 * 정기 송금 설정 요청 (POST /transfers/scheduled).
 * ValidateScheduledRequest의 union을 보존하면서 빈도/일자/메모를 더한다.
 * MONTHLY는 1~31, WEEKLY는 1(월)~7(일) ISO.
 */
export type CreateScheduledTransferRequest = ValidateScheduledRequest & {
  /** 반복 주기 (WEEKLY / MONTHLY). */
  frequency: ScheduledTransferFrequency;
  /** 실행 기준일 (MONTHLY=1~31, WEEKLY=1~7 ISO). */
  schedule_day: number;
  /** 메모(선택, 최대 255자). */
  memo?: string | null;
};

/** 정기 송금 설정 응답 (201) — 등록된 정기 송금 한 건의 스냅샷. */
export interface ScheduledTransferResponse {
  public_id: string;
  transfer_type: TransferTypeCode;
  amount: string;
  currency_code: string;
  receive_currency_code: string;
  frequency: ScheduledTransferFrequency;
  schedule_day: number;
  /** 다음 실행 예정일 (ISO 8601 date, KST). */
  next_run_date: string;
  /** 마지막 실행 시각 — 최초 실행 전이면 null. */
  last_run_at: string | null;
  status: ScheduledTransferStatus;
  created_at: string;
}

/** 정기 송금 회차 실행 이력 한 건 (GET /scheduled/{id}/history의 items[]). */
export interface ScheduledTransferHistoryItem {
  public_id: string;
  amount: string;
  currency_code: string;
  fee: string;
  receive_amount: string;
  receive_currency_code: string;
  /** 거래 상태 (현 단계는 COMPLETED만). */
  status: string;
  /** 실행 시각 (ISO 8601 UTC Z) — transactions.created_at. */
  executed_at: string;
}

/** 정기 송금 회차 이력 목록 응답 — 페이지 메타 + items 배열. */
export interface ScheduledTransferHistoryResponse {
  items: ScheduledTransferHistoryItem[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 정기송금 상태. */
export type ScheduledTransferStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

/** 정기송금 반복 주기. */
export type ScheduledTransferFrequency = 'WEEKLY' | 'MONTHLY';

/** 정기송금 목록 한 건 (백엔드 ScheduledTransferListItem). */
export interface ScheduledTransferItem {
  /** 정기송금 식별자(UUID). */
  public_id: string;
  /** 수취인명 (설정 시 snapshot, nullable). */
  receiver_name: string | null;
  /** 회차당 송금액 (string 소수 4자리). */
  amount: string;
  /** 출금 통화 코드. */
  currency_code: string;
  /** 수취 통화 코드. */
  receive_currency_code: string;
  /** 반복 주기 (WEEKLY / MONTHLY). */
  frequency: ScheduledTransferFrequency;
  /** 실행 기준일 (MONTHLY=1~31, WEEKLY=1~7 ISO). */
  schedule_day: number;
  /** 다음 실행 예정일 (ISO 8601 date, KST 기준, 예: "2026-06-25"). */
  next_run_date: string;
  /** 마지막 실행 시각 (ISO 8601 UTC Z). 최초 실행 전이면 null. */
  last_run_at: string | null;
  status: ScheduledTransferStatus;
  /** 정기송금 설정 시각 (ISO 8601 UTC Z). */
  created_at: string;
}

/** 정기송금 목록 응답 — 페이지 메타 + 항목 배열 (백엔드 ScheduledTransferListResponse). */
export interface ScheduledTransferListResponse {
  scheduled_transfers: ScheduledTransferItem[];
  page: number;
  size: number;
  total_elements: number;
  total_pages: number;
}

/** 최근 송금한 외부 계좌 한 건 (백엔드 RecentAccountsResponse.AccountItem). */
export interface RecentRemittanceAccountItem {
  /** 은행 코드 (예: "KOOKMIN"). */
  bank_code: string;
  /** 은행명 (예: "국민은행"). */
  bank_name: string;
  /** 마스킹된 계좌번호 (앞 3 + 별표 + 뒤 2). */
  account_number: string;
  /** 수취인명 (송금 시점 transactions.receiver_name snapshot). */
  account_holder: string;
  /** 가장 최근 송금의 통화 코드 (KRW/USD/PHP/VND 중 1). */
  currency_code: string;
  /** 가장 최근 송금 금액 (string 소수 4자리, 예: "200000.0000"). */
  last_amount: string;
  /** 가장 최근 송금 시각 (ISO 8601 UTC Z). */
  last_transferred_at: string;
}

/** 최근 송금 계좌 목록 응답 (GET /transfers/recent-accounts).
 *  계좌별 최신 송금 1건씩, 최근순. 이력 없으면 빈 배열. */
export interface RecentRemittanceAccountsResponse {
  accounts: RecentRemittanceAccountItem[];
}

/** 송금 종류 — 백엔드 TransactionType enum과 일치. */
export type TransferKind = 'INTERNAL_TRANSFER' | 'REMITTANCE';

/** 송금 수수료 조회 요청 (POST /transfers/fee). */
export interface TransferFeeRequest {
  /** 송금 방식 — INTERNAL_TRANSFER(앱 내, 수수료 0) / REMITTANCE(타행, amount × 0.5%). */
  transfer_type: TransferKind;
  /** 송금 통화 코드 (KRW/USD/PHP/VND). */
  currency_code: string;
  /** 송금 금액 (string 십진수, 정수 ≤14자리·소수 ≤4자리, 양수). 예: "10000.0000". */
  amount: string;
}

/** 송금 수수료 조회 응답 (백엔드 TransferFeeResponse).
 *  금액은 모두 소수 4자리 string. */
export interface TransferFeeResponse {
  /** 수수료. INTERNAL은 "0.0000". */
  fee: string;
  /** 수수료 통화 (송금 통화와 동일). */
  fee_currency_code: string;
  /** 총 출금 금액 = amount + fee. */
  total_deduct_amount: string;
}

// ---------- API 함수 ----------

export const walletApi = {
  /**
   * 송금 PIN 최초 등록 (201).
   *
   * <p>이미 등록돼 있으면 409 COMMON4091 → ApiException(code 'COMMON4091').
   * PIN 변경(기존 확인 후 교체) API는 백엔드 후속 과제.
   */
  setTransferPin: (body: TransferPinBody) => apiClient.post<unknown, void>('/transfers/pin', body),

  /**
   * 송금 PIN 검증 (200) — 송금 직전 이중 인증.
   *
   * <p>불일치 TRANSFER4007(400, 메시지에 남은 횟수) / 5회 초과 잠금 TRANSFER4008(429, 10분)
   * / 미설정 TRANSFER4009(400 → 설정 화면으로 유도). 모두 ApiException으로 throw.
   */
  verifyTransferPin: (body: TransferPinBody) =>
    apiClient.post<unknown, void>('/transfers/pin-verify', body),

  /**
   * 환전·재환전 지원 통화 목록 조회 (200).
   *
   * <p>백엔드 CurrencyType enum SSOT — 현재 4종(KRW/USD/PHP/VND). 응답 변경 시 자동 반영.
   */
  getSupportedCurrencies: () =>
    apiClient.get<unknown, SupportedCurrenciesResponse>('/exchanges/supported-currencies'),

  /**
   * 환전 견적 발급 (200) — 5분간 유효한 환율·수령액 스냅샷 생성.
   *
   * <p>발급된 quote_public_id로 {@link executeExchange}를 호출해야 실제 환전이 일어난다.
   * 미지원 통화 TRANSFER4002, 형식 오류 COMMON4001(둘 다 400) → ApiException으로 throw.
   */
  createExchangeQuote: (body: ExchangeQuoteRequest) =>
    apiClient.post<unknown, ExchangeQuoteResponse>('/exchanges/quote', body),

  /**
   * 환전 실행 (201) — 견적 단계의 환율·수령액으로 지갑 잔액 갱신.
   *
   * <p>Idempotency-Key 헤더 필수: 동일 키 재요청 시 백엔드가 첫 결과를 그대로 재반환한다.
   * 호출 측은 실행 직전에 {@code crypto.randomUUID()}로 키 한 번 생성해서 state에 박아두고
   * 네트워크 재시도 시 같은 키를 그대로 보내야 멱등성이 보장된다.
   *
   * <p>견적 만료 EXCHANGE4002(400), 잔액 부족 WALLET4002(422), 인증 AUTH4011(401) → ApiException.
   */
  executeExchange: (body: ExchangeExecuteRequest, idempotencyKey: string) =>
    apiClient.post<unknown, ExchangeResponse>('/exchanges', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  /**
   * 환전 내역 목록 조회 (200) — 본인의 환전·재환전 완료 내역을 최근순으로 페이지 조회.
   *
   * <p>응답에 페이지 메타(page/size/total_elements/total_pages)와 exchanges 배열이 함께 온다.
   * 각 exchange 객체가 단건 상세와 동일 구조라 모달 표시 시 별도 호출 없이 그대로 쓸 수 있다.
   * 페이지 0부터 시작. size 기본 20, 최대 100 (백엔드 @Min/@Max 검증).
   */
  getExchanges: (page = 0, size = 20) =>
    apiClient.get<unknown, ExchangeListResponse>('/exchanges', { params: { page, size } }),

  /**
   * 환전 내역 단건 조회 (200) — 특정 환전 내역을 public_id로 조회한다.
   *
   * <p>본인 것만 조회 가능 — 남의 public_id를 직접 요청하면 COMMON4031(권한 없음).
   * 존재하지 않으면 EXCHANGE4001. 인증 누락은 AUTH4011.
   *
   * <p>현재 화면은 목록 응답에 이미 단건 정보가 다 있어 모달에서 추가 호출 없이 사용한다.
   * 본 함수는 향후 직접 URL 접근(예: /mypage/exchange-history/:publicId) 도입 시 사용 예정.
   */
  getExchange: (publicId: string) =>
    apiClient.get<unknown, ExchangeResponse>(`/exchanges/${publicId}`),

  /**
   * 내 전자지갑 잔액 조회 (200) — 통화별 잔액 배열을 받는다.
   *
   * <p>잔액(balance)은 소수 4자리 string("1530000.0000"). 호출 측은 Number() 변환 후 표시.
   * balances 배열은 사용자가 보유한 통화만 포함 — 화면에서 특정 통화만 표시하고 싶다면
   * code 매칭 후 없으면 0 처리 (useBalances hook의 balanceOf helper 권장).
   *
   * <p>지갑 자체가 없으면 WALLET4001(404) → 신규 회원이거나 지갑 생성 실패 케이스.
   * 인증 누락은 AUTH4011(apiClient interceptor가 로그인 화면 이동).
   */
  getBalances: () => apiClient.get<unknown, WalletBalancesResponse>('/wallets/me/balances'),

  /**
   * 전자지갑 생성(멱등) — 이슈 #108/#152.
   *
   * <p>백엔드 멱등 API. 이미 지갑이 있으면 그대로 반환, 없으면 신규 생성 + KRW 0 잔액 1행 작성.
   * 사용 시점:
   * <ul>
   *   <li>신분증 인증 직후(AdditionalCertPage) — BE의 자동 개설이 실패해도 안전망으로 동작</li>
   *   <li>WALLET4001을 받은 다른 흐름(PIN 설정 등)의 보정 — 호출 후 원 작업 재시도</li>
   * </ul>
   */
  createWallet: () => apiClient.post<unknown, WalletCreateResult>('/wallets'),

  /**
   * 등록된 내 계좌 목록 조회 (200) — 주 계좌 우선, 최신 등록순.
   *
   * <p>계좌번호는 마스킹되어(앞 3 + 끝 2) 내려온다. 등록된 계좌가 없어도 404가 아니라
   * 200 + accounts: [] 빈 배열로 응답하므로, 화면은 길이 0을 "계좌 없음"으로 분기한다.
   * 사용자는 JWT의 public_id claim으로 식별 — 인증 누락은 AUTH4011(interceptor가 로그인 이동).
   */
  getMyAccounts: () => apiClient.get<unknown, AccountListResponse>('/accounts'),

  // ===== 정기 송금 =====
  // getScheduledTransfers(목록 조회)는 develop의 다른 PR에서 추가됨(아래에 정의) — 중복 제거.

  /**
   * 정기 송금 대상 유효성 검증 (200) — POST /transfers/scheduled/validate.
   *
   * <p>설정 직전 사전 검증. 응답의 {@code is_valid=false}면 {@code reason}으로 사용자에게 안내,
   * {@code is_valid=true}면 그대로 createScheduled를 이어 호출한다. HTTP 200이라도 비즈니스
   * 검증 실패는 응답 본문(reason)으로 표현되므로 호출 측은 ApiException이 아니라 응답을 봐야 한다.
   *
   * <p>형식 오류(amount/currency 등)는 백엔드가 400 COMMON4001로 던짐 → ApiException으로 throw.
   */
  validateScheduled: (body: ValidateScheduledRequest) =>
    apiClient.post<unknown, ValidateScheduledResponse>('/transfers/scheduled/validate', body),

  /**
   * 정기 송금 설정 (201) — POST /transfers/scheduled. 검증 통과 후 호출.
   *
   * <p>등록 시점엔 송금이 즉시 일어나지 않는다 — 백엔드 스케줄러가 next_run_date에 도래하면
   * 자동 실행. 응답의 public_id로 이력 조회({@link getScheduledHistory})에 사용.
   *
   * <p>에러: 400 COMMON4001(형식) / COMMON4221(currency 미일치, schedule_day 범위) / 401 AUTH4011
   * / 404 MEMBER4001(수신자 없음) / 409 등 → ApiException으로 throw.
   */
  createScheduled: (body: CreateScheduledTransferRequest) =>
    apiClient.post<unknown, ScheduledTransferResponse>('/transfers/scheduled', body),

  /**
   * 정기 송금 회차 이력 조회 (200) — GET /transfers/scheduled/{id}/history.
   *
   * <p>한 정기송금의 회차별 실행 이력. 본인 정기송금만 조회 가능, 본인 아니면 TRANSFER4001로 모호 매핑.
   * 현 단계는 모든 회차 status === 'COMPLETED'(스케줄러는 성공 회차만 기록).
   *
   * @param transferPublicId 정기송금 식별자(scheduled_transfers.public_id)
   */
  getScheduledHistory: (transferPublicId: string, page = 0, size = 20) =>
    apiClient.get<unknown, ScheduledTransferHistoryResponse>(
      `/transfers/scheduled/${transferPublicId}/history`,
      { params: { page, size } }
    ),

  /**
   * 추가 지원 은행 목록 조회 (200) — 계좌 등록 시 선택 가능한 활성 국내 은행(이름 가나다순).
   *
   * <p>은행 목록은 자주 바뀌지 않는 마스터 데이터 — hook에서 staleTime을 길게(5분) 둔다.
   * 인증 누락은 AUTH4011(interceptor가 로그인 이동).
   */
  getSupportedBanks: () =>
    apiClient.get<unknown, SupportedBankListResponse>('/accounts/supported-banks'),

  /**
   * 예금주 실명 조회 (200) — bankCode + accountNumber로 Mock 은행에 실명을 조회한다.
   *
   * <p>사용자가 계좌번호 입력 후 "예금주 조회"를 누를 때 호출(온디맨드). 조회 횟수 rate-limit이
   * 있어(COMMON4291, 429) 자동 호출/재시도하지 않는다 — useMutation으로 명시적 트리거만.
   *
   * <p>존재하지 않는 계좌 ACCOUNT4001(404), 형식 오류 COMMON4001(400),
   * Mock 은행 통신 장애 COMMON5031(503) → 모두 ApiException으로 throw.
   */
  getAccountHolder: (bankCode: string, accountNumber: string) =>
    apiClient.get<unknown, AccountHolderResponse>('/accounts/holder', {
      params: { bankCode, accountNumber },
    }),

  /**
   * 계좌 연결 + 자동이체 인증 요청 (200) — Mock 은행에 인증을 요청하고 account_token을 받는다.
   *
   * <p>받은 account_token을 {@link registerAccount}에 그대로 넘겨야 등록이 완료된다.
   * 인증 실패 ACCOUNT4002(400), 없는 계좌 ACCOUNT4001(404), 횟수초과 ACCOUNT4005(429),
   * 은행장애 COMMON5031(503) → 모두 ApiException으로 throw.
   */
  verifyAccount: (body: VerifyAccountRequest) =>
    apiClient.post<unknown, VerifyAccountResponse>('/accounts/verify', body),

  /**
   * 계좌 등록 최종 완료 (201) — verify에서 받은 account_token으로 계좌를 등록한다.
   *
   * <p>성공 시 등록된 계좌(AccountResponse, AccountItem과 동일 구조)를 반환.
   * 목록(getMyAccounts)에 즉시 반영하려면 ['wallet','accounts']를 invalidate한다
   * (useRegisterAccount hook의 onSuccess가 처리).
   * 이미 등록된 계좌 ACCOUNT4004(409), 형식/은행코드 오류 COMMON4001(400) → ApiException.
   */
  registerAccount: (body: RegisterAccountRequest) =>
    apiClient.post<unknown, AccountItem>('/accounts', body),

  /**
   * 충전 금액 검증·실행 (201) — 연결된 계좌(accountId)에서 전자지갑으로 KRW를 충전한다.
   *
   * <p>Idempotency-Key 헤더 필수: 동일 키 재요청 시 백엔드가 첫 결과를 그대로 재반환(멱등).
   * 호출 측은 (계좌, 금액) 단위로 키를 한 번 생성해 네트워크 재시도 시 같은 키를 보낸다.
   *
   * <p>응답에 충전 후 잔액(wallet_balance)이 포함된다. 연동 계좌 잔액 부족 ACCOUNT4003(400),
   * 미인증 계좌 ACCOUNT4006(403), 한도 초과 ACCOUNT4007(422), 지갑 없음 WALLET4001(404)
   * → 모두 ApiException으로 throw.
   */
  chargeAccount: (accountId: string, body: ChargeRequest, idempotencyKey: string) =>
    apiClient.post<unknown, ChargeResponse>(`/accounts/${accountId}/charge`, body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  /**
   * 내 전자지갑 + 원화 환산 총액 조회 (200) — 보유 통화별 잔액·환율·환산액·전체 합산을 한 번에.
   *
   * <p>홈 화면 "지금 나의 원화" 카드에 total_balance_in_krw 표시용. KRW 포함 보유 모든 통화의
   * "잔액 × KRW 환율" 합계가 백엔드에서 계산돼 string으로 내려온다 (소수 4자리).
   *
   * <p>에러: WALLET4001(404, 지갑 없음) / TRANSFER4002(400, 미지원 통화 = 환율 누락) /
   * AUTH4011(401 — interceptor 처리) / COMMON5000(500, 서버 오류).
   */
  getWalletMe: () => apiClient.get<unknown, WalletMeResponse>('/wallets/me'),

  /**
   * 주요 통화 환율 위젯 조회 (200) — KRW 기준 "1 외화→KRW" 환율 + 등락률.
   *
   * <p>홈 화면 "실시간 환율" 가로 카드용. currencyCodes 미지정 시 KRW 제외 전체 지원 통화 반환.
   *
   * <p>change_rate는 표시 전용 number (등락률 %). 직전 값 없으면 0.
   * dev 환경은 Mock 고정값, prod는 Redis cron(exchange-updater) 매일 자정 갱신.
   *
   * <p>에러: TRANSFER4002(400, 미지원 통화) / AUTH4011(401 — interceptor 처리) / COMMON5000(500).
   *
   * @param currencyCodes 조회할 통화 코드 콤마 구분 (예: "USD,PHP,VND"). 생략 시 KRW 제외 전체.
   */
  getExchangeRatesWidget: (currencyCodes?: string) =>
    apiClient.get<unknown, ExchangeRateWidgetResponse>('/wallets/exchange-rates', {
      params: currencyCodes ? { currency_codes: currencyCodes } : undefined,
    }),

  /**
   * 송금 지원 통화 목록 조회 (200) — 송금 화면 통화 드롭다운용.
   *
   * <p>백엔드 CurrencyType enum SSOT — 현재 4종(KRW/USD/PHP/VND).
   * ⚠️ 환전 도메인의 getSupportedCurrencies와 별개(필드명: code/name/symbol).
   *
   * <p>경로: /transfers/supported-currencies (노션 표는 /currencies/supported로 잘못 표기됨).
   */
  getTransferSupportedCurrencies: () =>
    apiClient.get<unknown, TransferSupportedCurrenciesResponse>('/transfers/supported-currencies'),

  /**
   * 최근 송금 앱 사용자 조회 (200) — TransferApp 화면 상단 "최근 송금" 칩용.
   *
   * <p>수신자별 최신 송금 1건씩, 최근순. 송금 이력 없으면 빈 배열(받은 사람만 있어도 X).
   * 신규 사용자는 빈 배열 응답 — UI에서 빈 상태 안내.
   *
   * <p>경로 주의: 노션 표는 /transfers/recent-receivers로 잘못 표기됨 → 실제는 /recent-recipients/members.
   */
  getRecentInternalRecipients: () =>
    apiClient.get<unknown, RecentRecipientsResponse>('/transfers/recent-recipients/members'),

  /**
   * 앱 사용자 유효성 검증 (200) — 이메일로 받는 사람 존재/식별.
   *
   * <p>송금 화면에서 사용자가 받는 사람 이메일 입력 후 "확인" 누를 때 호출.
   * 성공 시 receiver_public_id 받아 송금 실행 API에 식별자로 사용.
   *
   * <p>에러: COMMON4001(400, 이메일 형식 위반) / MEMBER4001(가능성, 존재하지 않는 회원) /
   * AUTH4011(401 — interceptor 처리).
   *
   * <p>경로 주의: 노션 표는 POST /receivers/search로 잘못 표기됐었음 → 실제는 GET /validate-member.
   */
  validateMember: (email: string) =>
    apiClient.get<unknown, ValidateMemberResponse>('/transfers/validate-member', {
      params: { email },
    }),

  /**
   * 정기송금 목록 조회 (200) — 본인이 설정한 정기송금 페이지 조회.
   *
   * <p>RecurringList 화면용. created_at DESC 정렬 (최신 설정 우선).
   *
   * <p>status 필터 — ACTIVE/PAUSED/CANCELLED 중 1, 미지정 시 전체. 잘못된 값은 COMMON4001.
   *
   * @param status 상태 필터 (선택)
   * @param page 페이지 번호 (0부터)
   * @param size 페이지당 건수 (기본 20, 최대 100)
   */
  getScheduledTransfers: (status?: ScheduledTransferStatus, page = 0, size = 20) =>
    apiClient.get<unknown, ScheduledTransferListResponse>('/transfers/scheduled', {
      params: status ? { status, page, size } : { page, size },
    }),

  /**
   * 최근 송금한 계좌 조회 (200) — TransferBank 화면 "최근 송금한 계좌" 섹션용.
   *
   * <p>내가 과거에 타인 계좌로 보낸 송금의 최신 1건씩 계좌별로 묶어 최근순으로 반환.
   * 송금 이력 없거나 외부 송금만 한 적이 없으면 빈 배열.
   *
   * <p>에러: COMMON4001(400, size 1~50 범위 위반) / AUTH4011(401, interceptor 처리)
   * / WALLET4001(404, 지갑 없음 — UI에서 섹션 숨김 처리).
   *
   * @param size 조회 건수 (1~50, 기본 10)
   */
  getRecentRemittanceAccounts: (size?: number) =>
    apiClient.get<unknown, RecentRemittanceAccountsResponse>('/transfers/recent-accounts', {
      params: size !== undefined ? { size } : undefined,
    }),

  /**
   * 송금 수수료 조회 (200) — TransferConfirm 화면 수수료 표시용.
   *
   * <p>입력(송금 종류·통화·금액)으로 수수료를 계산해 반환. DB·외부 호출 없는 순수 계산.
   * 정책: INTERNAL_TRANSFER=0, REMITTANCE=amount × 0.5% (HALF_UP 4자리).
   *
   * <p>에러: COMMON4001(400, body 검증 — 음수/형식) / TRANSFER4002(400, 미지원 통화)
   * / TRANSFER4003(400, 미지원 송금 유형) / AUTH4011(401, interceptor 처리).
   */
  getTransferFee: (body: TransferFeeRequest) =>
    apiClient.post<unknown, TransferFeeResponse>('/transfers/fee', body),

  /**
   * 송금 실행 (201) — POST /api/v1/transfers (api-spec §6).
   *
   * <p>1·2단계 범위: same-currency 송금만(`currency_code === receive_currency_code`). 다통화는 3단계.
   * INTERNAL_TRANSFER는 같은 통화 송금만, REMITTANCE는 외부 계좌로 같은 통화 송금.
   *
   * <p>TX-PIN 흐름: 직전에 `verifyTransferPin` 성공으로 서버에 단명·단일사용 마커
   * (`pin:verified:{userPublicId}`, TTL 180초)가 있어야 한다. 마커 없으면 TRANSFER4010(428),
   * PIN 자체 미설정이면 TRANSFER4009(400).
   *
   * <p>Idempotency-Key 헤더 필수: 호출 측은 결제 흐름 진입(TransferConfirm)에서 `crypto.randomUUID()`로
   * 키를 한 번 고정하고, 뒤로가기·네트워크 재시도에도 같은 키를 그대로 보내야 멱등성이 보장된다.
   * 동일 키 재요청 시 백엔드가 첫 결과(2xx)를 그대로 재반환(3-layer: Redis 캐시 → DB UNIQUE → race 시 재조회).
   *
   * <p>주요 에러 (모두 ApiException으로 throw):
   * - 400 COMMON4001 — Body 검증 실패
   * - 400 TRANSFER4002/4003/4004/4005 — 통화/유형/자기송금/통화조합
   * - 400 TRANSFER4009 / 428 TRANSFER4010 — PIN 관련(TX-PIN)
   * - 422 WALLET4002 / WALLET4003 — 잔액 부족 / 비활성 지갑
   * - 429 TRANSFER4006 / TRANSFER4008 — rate-limit / PIN 5회 잠금
   * - 503 COMMON5031 — 락 경합·Mock 은행 일시 장애(REMITTANCE)
   */
  executeTransfer: (body: TransferExecuteRequest, idempotencyKey: string) =>
    apiClient.post<unknown, TransferExecuteResponse>('/transfers', body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    }),

  /**
   * 송금 확인증 단건 조회 (200) — 완료된 INTERNAL_TRANSFER 또는 REMITTANCE 한 건 (api-spec §7-1).
   *
   * <p>본인 검증: 송신자(거래 wallet 주인) 본인만 조회 가능. 본인 아님·미존재·미지원 유형 실패는
   * 모두 TRANSFER4001로 모호 매핑됨(cross-user 응답 노출 방지 정책). 화면은 단일 에러 메시지로 처리.
   *
   * <p>에러: 400 COMMON4001(path 형식) / 401 AUTH4011(interceptor 처리) / TRANSFER4001(본인 아님·미존재·유형)
   * / 500 COMMON5000 → 모두 ApiException으로 throw.
   *
   * @param transferPublicId 송금 거래 식별자(UUID, transactions.public_id)
   */
  getReceipt: (transferPublicId: string) =>
    apiClient.get<unknown, TransferReceiptResponse>(`/transfers/${transferPublicId}/receipt`),

  /**
   * 내 거래내역 목록 조회 (200) — 본인이 송신자 또는 수신자인 전 유형 거래를 최근순으로 페이지 조회.
   *
   * <p>INTERNAL_TRANSFER는 transactions 테이블에 송신자 row 1건만 INSERT되고 수신자는
   * receiver_wallet FK로만 연결되므로, 백엔드가 송수신 OR 조회로 양쪽을 모은다. 각 항목의
   * direction(OUT/IN)으로 본인 시점의 출금/입금을 판단한다 (api-spec §3).
   *
   * <p>응답에 페이지 메타(page/size/total_elements/total_pages)와 transactions 배열이 함께 온다.
   * 페이지 0부터 시작. size 기본 20, 최대 100 (백엔드 @Min/@Max 검증).
   *
   * <p>지갑 미존재/거래 없음은 예외가 아니라 빈 페이지로 반환된다. 인증 누락은 AUTH4011.
   */
  getTransactions: (page = 0, size = 20) =>
    apiClient.get<unknown, TransactionListResponse>('/wallets/me/transactions', {
      params: { page, size },
    }),

  /**
   * 주 계좌 변경 (200) — 활성 계좌 중 하나를 주 계좌로 지정한다. 기존 주 계좌는 자동 해제되어
   * 사용자당 주 계좌가 항상 1개로 유지된다. 이미 주 계좌인 계좌를 다시 지정하면 멱등 성공.
   *
   * <p>응답으로 변경된 AccountResponse(is_primary=true)를 반환. 호출 측은 onSuccess에서
   * ['wallet','accounts']를 invalidate해 목록 정렬(주 계좌 우선)을 서버 기준으로 갱신한다.
   *
   * <p>존재하지 않는 계좌(미존재/타인/비활성) ACCOUNT4001(404), 분산락 실패 COMMON5031(503),
   * 인증 누락 AUTH4011(401, interceptor 처리) → 모두 ApiException으로 throw.
   */
  setPrimaryAccount: (accountId: string) =>
    apiClient.patch<unknown, AccountItem>(`/accounts/${accountId}/primary`),

  /**
   * 계좌 삭제 (200) — 지정한 계좌를 soft-delete(is_active=false)한다. 주 계좌를 삭제하면
   * 남은 활성 계좌 중 가장 최근 등록 1건이 자동으로 주 계좌로 승격된다(마지막 1개면 주 계좌
   * 없는 상태 허용). 응답 data는 null.
   *
   * <p>호출 측은 onSuccess에서 ['wallet','accounts']를 invalidate해 목록을 서버 기준으로 갱신.
   *
   * <p>존재하지 않는 계좌(미존재/타인/이미 비활성) ACCOUNT4001(404), 분산락 실패 COMMON5031(503),
   * 인증 누락 AUTH4011(401) → 모두 ApiException으로 throw.
   */
  deleteAccount: (accountId: string) => apiClient.delete<unknown, void>(`/accounts/${accountId}`),

  // TODO: 다음 사이클에서 추가
  //   송금: validateMember, validateBank, execute, getReceipt, getRecentRecipients
  //   정기송금: validateScheduled, createScheduled, listScheduled, getHistory
};
