import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // ── 개발용 API 프록시 ──────────────────────────────────────
    // 프론트(5173)가 백엔드(8081/8084/…)를 직접 부르면 포트가 달라 CORS에 막힌다.
    // 대신 상대경로(/api/...)로 부르면 Vite 개발서버가 아래 규칙대로 각 서비스에 "대신" 전달한다
    // (= API Gateway 흉내). 그래서 .env.local의 VITE_API_BASE_URL은 비워 둔다.
    // 운영에서는 실제 게이트웨이가 이 역할을 한다.
    proxy: {
      // member-service (8081)
      '/api/v1/auth': { target: 'http://localhost:8081', changeOrigin: true },
      '/api/v1/members': { target: 'http://localhost:8081', changeOrigin: true },
      // wallet-service (8084)
      '/api/v1/wallets': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/v1/exchanges': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/v1/transfers': { target: 'http://localhost:8084', changeOrigin: true },
      '/api/v1/accounts': { target: 'http://localhost:8084', changeOrigin: true },
      // community(8082)·document 경로는 해당 화면 연동할 때 같은 방식으로 추가.
    },
  },
});
