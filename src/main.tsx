import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import './index.css';

/**
 * TanStack Query 전역 클라이언트.
 *
 * - staleTime 30s: GET 응답을 30초간 fresh로 간주 → 같은 화면 진입 시 재요청 회피.
 *   금융 데이터(잔액 등)는 hook별로 staleTime을 0으로 override.
 * - retry 1: 일시적 네트워크 오류만 1회 재시도. ApiException(4xx)은 retry 불필요(아래 분기).
 * - refetchOnWindowFocus: 모바일 PWA 특성상 백그라운드 복귀 잦음 → 활성화 유지.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        // 4xx 비즈니스 에러는 retry 무의미 (잘못된 요청·권한 없음 등)
        const status = (error as { httpStatus?: number })?.httpStatus;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
    },
    mutations: {
      // 송금·결제 같은 mutation은 자동 retry 금지 — 중복 실행 위험.
      retry: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* dev 환경에서만 자동 표시. 빌드 산출물에 포함되지 않음. */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </StrictMode>
);
