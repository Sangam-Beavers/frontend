import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

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
  constructor(
    public readonly code: string,
    public readonly httpStatus: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiException';
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

// ---------- Request interceptor — JWT 자동 부착 (인증 도입 후 활성화) ----------

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // TODO: 팀원의 PKCE 인증 도입 후 활성화 — useAuthStore에서 토큰을 꺼내 Authorization 헤더에 부착.
  //   const token = useAuthStore.getState().accessToken;
  //   if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------- Response interceptor — envelope 자동 파싱 + 에러 매핑 ----------

apiClient.interceptors.response.use(
  // 성공 응답: { success: true, data, message } → data만 추출해 반환.
  // 호출 측은 res.data가 곧 ApiResponse의 data 필드(실제 도메인 객체)다.
  (res) => {
    const body = res.data as ApiSuccess<unknown>;
    // 백엔드가 envelope을 따르지 않는 경우(예: 외부 프록시 에러 페이지)는 body 자체를 반환.
    if (body && typeof body === 'object' && 'success' in body && body.success === true) {
      return body.data;
    }
    return body;
  },
  // 실패 응답: ApiException으로 변환해 일관된 형태로 throw.
  // 호출 측은 try/catch + e.code로 비즈니스 에러 분기 가능.
  (err: AxiosError<ApiError>) => {
    const status = err.response?.status ?? 0;
    const body = err.response?.data;

    // 401 — 인증 만료/누락 (AUTH4011). 팀원이 PKCE 도입 후 refresh 로직 추가 예정.
    if (status === 401) {
      // TODO: refresh token으로 갱신 시도 → 실패 시 로그인 페이지로 redirect.
      //   useAuthStore.getState().clear();
      //   window.location.href = '/login';
    }

    // envelope 형태로 응답이 온 경우(대부분의 경우) code/message 추출.
    if (body && typeof body === 'object' && body.success === false) {
      throw new ApiException(body.code, status, body.message);
    }

    // 네트워크 에러, timeout, CORS, 5xx 등 envelope 없는 경우.
    throw new ApiException('NETWORK_ERROR', status, err.message || '네트워크 오류가 발생했습니다.');
  }
);
