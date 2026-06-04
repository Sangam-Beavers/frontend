// ─────────────────────────────────────────────────────────────
// auth/api.ts  —  ④ 백엔드 API 부르는 도우미
// 평범한 fetch와 같지만, 저장된 토큰을 자동으로
// "Authorization: Bearer <토큰>" 헤더에 붙여 준다.
// (팔찌를 차고 다니게 해주는 단계)
//
// 사용 예:
//   const res = await apiFetch('/api/v1/members/me');
//   const data = await res.json();
// ─────────────────────────────────────────────────────────────

import { apiBaseUrl } from './config';
import { getAccessToken, clearLocalTokens } from './tokenStore';

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });

  // 401 = 토큰 없음/만료/무효 → 백엔드가 막은 것. 로컬 토큰만 비운다.
  // (여긴 API 호출 중이라 화면을 통째로 Authentik으로 보내지 않고, 토큰만 정리)
  if (res.status === 401) clearLocalTokens();

  return res;
}
