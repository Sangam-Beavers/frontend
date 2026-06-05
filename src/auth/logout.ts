// ─────────────────────────────────────────────────────────────
// auth/logout.ts  —  로그아웃 (RP-Initiated Logout)
//
// 방식 B(프론트↔IdP 직접 PKCE)의 OIDC 표준 절차.
//
// 흐름:
//   1) 로컬 토큰 정리 (access_token / id_token) — 우리 앱 문 닫기
//   2) Authentik end_session endpoint 로 redirect
//      - id_token_hint:           내가 누구였는지 IdP가 알아보게(권장 파라미터)
//      - post_logout_redirect_uri: IdP가 세션 죽인 뒤 돌려보낼 주소(우리 /login)
//   3) Authentik이 IdP 세션 제거 → post_logout_redirect_uri 로 redirect
//
// 왜 필요?
//   로컬 토큰만 지우면 우리 앱은 "로그아웃"처럼 보이지만, Authentik 쪽 세션이 살아있어서
//   다시 로그인 버튼을 누르면 IdP가 "이미 인증된 사용자"로 보고 자동 통과시켜 버린다
//   (= 사용자 체감 "로그아웃 안 됨"). end_session 호출해야 IdP 세션도 죽는다.
// ─────────────────────────────────────────────────────────────

import { authConfig } from './config';
import { clearLocalTokens, getIdToken } from './tokenStore';

export function startLogout(): void {
  // 어떤 경우에도 로컬 토큰은 먼저 비운다 — IdP 호출이 실패하더라도 우리 앱은 로그아웃 상태가 되도록.
  const idToken = getIdToken();
  clearLocalTokens();

  // end_session endpoint 가 설정돼 있으면 IdP 세션까지 종료 시도.
  if (authConfig.endSessionEndpoint) {
    const params = new URLSearchParams();
    if (idToken) params.set('id_token_hint', idToken);
    if (authConfig.postLogoutRedirectUri) {
      params.set('post_logout_redirect_uri', authConfig.postLogoutRedirectUri);
    }
    // 화면을 IdP로 이동. IdP가 세션 죽이고 redirect_uri 로 다시 보냄.
    window.location.href = `${authConfig.endSessionEndpoint}?${params.toString()}`;
    return;
  }

  // fallback — env 미설정 시 로컬만 정리하고 로그인 화면으로.
  // (IdP 세션이 살아있을 수 있어 다시 로그인 누르면 자동 통과될 수 있음 — env 채워야 진짜 동작)
  window.location.href = '/login';
}
