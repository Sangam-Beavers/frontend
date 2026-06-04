import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 로컬 백엔드 서비스 포트 (CLAUDE.md 백엔드 멀티모듈 — 서비스별 8081~8084 고정)
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
    // Dev 전용 reverse proxy — 프론트(5173)와 same-origin인 것처럼 백엔드 호출.
    // 결과적으로 브라우저 → Vite → 백엔드(다른 포트) 흐름이라 CORS 회피.
    // 운영기 배포 시엔 Envoy/ALB가 같은 역할(코드 변경 없음).
    proxy: {
      '/api/v1/members': BACKEND.MEMBER,
      '/api/v1/wallets': BACKEND.WALLET,
      '/api/v1/transfers': BACKEND.WALLET,
      '/api/v1/scheduled': BACKEND.WALLET,
      '/api/v1/community': BACKEND.COMMUNITY,
      '/api/v1/documents': BACKEND.DOCUMENT,
    },
  },
});
