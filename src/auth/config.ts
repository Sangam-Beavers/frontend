// ─────────────────────────────────────────────────────────────
// auth/config.ts  —  설정값 보관함
// .env.local 에 적어둔 값들을 한 곳에 모아 꺼내 쓴다.
// 다른 파일은 여기(authConfig)만 가져다 쓰면 됨.
// ─────────────────────────────────────────────────────────────

export const authConfig = {
  clientId: import.meta.env.VITE_OIDC_CLIENT_ID,
  authorizeEndpoint: import.meta.env.VITE_OIDC_AUTHORIZE_ENDPOINT,
  tokenEndpoint: import.meta.env.VITE_OIDC_TOKEN_ENDPOINT,
  redirectUri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  scope: import.meta.env.VITE_OIDC_SCOPE,
};

// 비어 있으면 상대경로(/api/...) → Vite 프록시(vite.config.ts)가 서비스별로 전달(개발). 운영은 게이트웨이 주소.
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
