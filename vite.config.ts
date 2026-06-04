import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 로컬 백엔드 서비스 포트 (CLAUDE.md 백엔드 멀티모듈 — 서비스별 8081~8084 고정).
// 운영기에서는 Envoy/ALB가 같은 역할(/api/v1/{도메인} → 각 서비스)을 하므로
// 프론트 코드의 호출 경로는 dev/prod 동일하게 '/api/v1/...'을 유지한다.
const BACKEND = {
  MEMBER: 'http://localhost:8081',
  COMMUNITY: 'http://localhost:8082',
  DOCUMENT: 'http://localhost:8083',
  WALLET: 'http://localhost:8084',
} as const;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // ── 개발용 API 프록시 ──────────────────────────────────────
    // 프론트(5173)가 백엔드(8081/8084/…)를 직접 부르면 포트가 달라 CORS에 막힌다.
    // 대신 상대경로(/api/...)로 부르면 Vite 개발서버가 아래 규칙대로 각 서비스에 "대신" 전달한다
    // (= API Gateway 흉내). 그래서 VITE_API_BASE_URL은 비워 둔다.
    // 운영에서는 실제 게이트웨이(Envoy/ALB)가 이 역할을 한다 — 코드 변경 없음.
    //
    // changeOrigin: true — Host 헤더를 target으로 변경. virtual host 기반 백엔드에서 필요.
    proxy: {
      // member-service (8081)
      '/api/v1/auth': { target: BACKEND.MEMBER, changeOrigin: true },
      '/api/v1/members': { target: BACKEND.MEMBER, changeOrigin: true },
      // wallet-service (8084)
      '/api/v1/wallets': { target: BACKEND.WALLET, changeOrigin: true },
      '/api/v1/transfers': { target: BACKEND.WALLET, changeOrigin: true },
      '/api/v1/scheduled': { target: BACKEND.WALLET, changeOrigin: true },
      '/api/v1/exchanges': { target: BACKEND.WALLET, changeOrigin: true },
      '/api/v1/accounts': { target: BACKEND.WALLET, changeOrigin: true },
      // community-service (8082)
      '/api/v1/community': { target: BACKEND.COMMUNITY, changeOrigin: true },
      // document-service (8083)
      '/api/v1/documents': { target: BACKEND.DOCUMENT, changeOrigin: true },
    },
  },
});
