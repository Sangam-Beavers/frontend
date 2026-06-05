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

  // TODO: 다음 사이클에서 추가
  //   잔액: getBalance
  //   계좌: registerAccount, deleteAccount, getMyAccounts
  //   충전: charge
  //   송금: validateMember, validateBank, execute, getReceipt, getRecentRecipients
  //   정기송금: validateScheduled, createScheduled, listScheduled, getHistory
};
