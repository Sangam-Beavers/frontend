import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, clearLocalTokens } from '@/auth/tokenStore';
import { ROUTES } from '@/constants/routes';

/**
 * 백엔드 ApiResponse / ErrorResponse 형식 (gb-backend common-response 모듈 SSOT).
 *
 * - 성공: { success: true, data: T, message: string }
 * - 실패: { success: false, code: string, message: string } (data 키 없음)
 *
 * interceptor가 envelope을 자동으로 풀어, 호출 측 코드는 항상 data만 받는다.
 */
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiError {
  success: false;
  code: string;
  message: string;
}

/**
 * API 호출 실패 시 throw되는 커스텀 에러.
 * 호출 측에서 try/catch + err.code로 분기 처리 가능.
 *
 * @example
 *   try { await communityApi.getQna(); }
 *   catch (e) {
 *     if (e instanceof ApiException && e.code === 'COMMON4001') { ... }
 *   }
 */
export class ApiException extends Error {
  // 생성자 파라미터 프로퍼티(public readonly ...)는 tsconfig의 erasableSyntaxOnly에서
  // 금지(TS1294)라, 필드 선언 + 생성자 대입으로 풀어서 작성한다. 동작은 동일.
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, httpStatus: number, message: string) {
    super(message);
    this.name = 'ApiException';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

// ---------- axios 인스턴스 ----------

/**
 * baseURL = '/api/v1' — Vite proxy(dev) 또는 Envoy/ALB(prod)가 백엔드 4개 서비스로 라우팅한다.
 * 같은 origin 호출이라 CORS 별도 설정 불필요(Vite proxy 환경 기준).
 *
 * timeout 15s — 송금/문서 분석 같이 느린 API 고려.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------- Request interceptor — JWT 자동 부착 ----------

/**
 * 매 요청마다 sessionStorage의 access_token을 Authorization: Bearer 헤더에 부착.
 *
 * 토큰 발급/저장은 auth 도메인(login.ts → Callback.tsx → tokenStore.ts) 담당.
 * apiClient는 그 결과를 읽기만 한다(읽기 전용 의존). 호출 측 컴포넌트/hook이
 * 헤더를 직접 만질 필요 없음(가이드 §2 "인증 토큰" 참고).
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------- Response interceptor — envelope 자동 파싱 + 에러 매핑 ----------

apiClient.interceptors.response.use(
  // 성공 응답: { success: true, data, message } → data만 추출해 반환.
  // 호출 측은 res.data가 곧 ApiResponse의 data 필드(실제 도메인 객체)다.
  //
  // envelope을 따르지 않는 2xx 응답(잘못된 업스트림·프록시 에러 페이지 등)은
  // ApiException으로 throw — React Query 입장에서 "성공"으로 오인되어 페이지 코드가
  // 도메인 필드 접근 중에 늦게 터지는 것을 막는다(SSOT 강제). CodeRabbit 리뷰 반영.
  // 타입 단언 주의: axios 타입은 "AxiosResponse를 반환"을 기대하지만, 우리는 의도적으로
  // envelope을 풀어 data만 반환한다(팀 표준). 호출부 타입은 apiClient.get<unknown, T>의
  // 두 번째 제네릭이 결정하므로, 여기서는 단언으로 타입 경고만 잠재운다(런타임 동작 동일).
  (res) => {
    const body = res.data as ApiSuccess<unknown>;
    if (body && typeof body === 'object' && 'success' in body && body.success === true) {
      return body.data as unknown as typeof res;
    }
    throw new ApiException(
      'INVALID_ENVELOPE',
      res.status,
      '백엔드 응답이 표준 envelope을 따르지 않습니다.'
    );
  },
  // 실패 응답: ApiException으로 변환해 일관된 형태로 throw.
  // 호출 측은 try/catch + e.code로 비즈니스 에러 분기 가능.
  (err: AxiosError<ApiError>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data;

    // 401 — 인증 만료/누락(AUTH4011). 로컬 토큰 정리 후 로그인 페이지로 강제 이동.
    //
    // 단순 redirect를 쓰는 이유: React Router 안에서 호출됐든(컴포넌트)·바깥에서 호출됐든
    // (서비스 함수) 모두 동작해야 하므로 window.location.href가 가장 견고하다(SPA 상태 초기화 효과도).
    // 이미 로그인 페이지에 있으면 무한 이동 방지로 skip.
    //
    // TODO: refresh_token으로 silent renew 시도 후 실패 시에만 이동하도록 개선.
    //   현재는 tokenStore가 refresh_token 사용 안 함(sessionStorage 단순 저장).
    if (status === 401) {
      clearLocalTokens();
      if (window.location.pathname !== ROUTES.LOGIN) {
        window.location.href = ROUTES.LOGIN;
      }
    }

    // envelope 형태로 응답이 온 경우(대부분의 경우) code/message 추출.
    if (body && typeof body === 'object' && body.success === false) {
      throw new ApiException(body.code, status, body.message);
    }

    // 네트워크 에러, timeout, CORS, 5xx 등 envelope 없는 경우.
    throw new ApiException('NETWORK_ERROR', status, err.message || '네트워크 오류가 발생했습니다.');
  }
);
