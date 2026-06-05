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
  // 로그아웃 (RP-Initiated Logout) — Authentik OIDC end_session endpoint.
  // 미설정이면 logout.ts가 로컬 정리 후 /login으로만 이동(IdP 세션은 유지될 수 있음).
  endSessionEndpoint: import.meta.env.VITE_OIDC_END_SESSION_ENDPOINT as string | undefined,
  // 로그아웃 완료 후 IdP가 사용자를 돌려보낼 주소. IdP에 strict 등록된 값과 정확히 일치해야 함.
  // 미설정이면 현재 origin + /login (로컬 개발 시 http://localhost:5173/login).
  postLogoutRedirectUri:
    (import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI as string | undefined) ??
    (typeof window !== 'undefined' ? `${window.location.origin}/login` : undefined),
};

// 비어 있으면 상대경로(/api/...) → Vite 프록시(vite.config.ts)가 서비스별로 전달(개발). 운영은 게이트웨이 주소.
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';
