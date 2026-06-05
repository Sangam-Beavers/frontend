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

/** 지갑 상태. */
export type WalletStatusCode = 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

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
   * 등록된 내 계좌 목록 조회 (200) — 주 계좌 우선, 최신 등록순.
   *
   * <p>계좌번호는 마스킹되어(앞 3 + 끝 2) 내려온다. 등록된 계좌가 없어도 404가 아니라
   * 200 + accounts: [] 빈 배열로 응답하므로, 화면은 길이 0을 "계좌 없음"으로 분기한다.
   * 사용자는 JWT의 public_id claim으로 식별 — 인증 누락은 AUTH4011(interceptor가 로그인 이동).
   */
  getMyAccounts: () => apiClient.get<unknown, AccountListResponse>('/accounts'),

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

  // TODO: 다음 사이클에서 추가
  //   원화 환산 총액: getWalletMe (GET /wallets/me, Kyubo)
  //   환율 위젯: getExchangeRates (GET /wallets/exchange-rates, Kyubo)
  //   계좌: deleteAccount (DELETE /accounts/{id}), setPrimary (PATCH /accounts/{id}/primary)
  //   충전: charge
  //   송금: validateMember, validateBank, execute, getReceipt, getRecentRecipients
  //   정기송금: validateScheduled, createScheduled, listScheduled, getHistory
};
