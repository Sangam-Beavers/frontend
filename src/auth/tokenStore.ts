// ─────────────────────────────────────────────────────────────
// auth/tokenStore.ts  —  토큰(=입장 팔찌) 보관함
// 로그인으로 받은 토큰을 저장/조회/삭제한다. 한 군데로 모아두면
// 나중에 저장 방식을 바꿔도 여기만 고치면 됨.
//
// ⚠️ 지금은 배우기 쉽게 sessionStorage(탭 닫으면 사라지는 임시 저장소)에 둔다.
//    운영 배포 전에는 보안 방식을 팀과 다시 정하자. (TODO)
// ─────────────────────────────────────────────────────────────

// Authentik 토큰 응답 모양 (필요한 것만)
export interface TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

const ACCESS = 'access_token';
const ID = 'id_token'; // 로그아웃 때 Authentik에 신원 증명으로 넘김

export function saveTokens(tokens: TokenResponse): void {
  sessionStorage.setItem(ACCESS, tokens.access_token);
  if (tokens.id_token) sessionStorage.setItem(ID, tokens.id_token);
}

// 우리 백엔드 부를 때 쓸 신분증
export function getAccessToken(): string | null {
  return sessionStorage.getItem(ACCESS);
}

// 로그아웃 시 Authentik에 넘길 신원 증명(id_token)
export function getIdToken(): string | null {
  return sessionStorage.getItem(ID);
}

// 토큰이 있으면 "로그인된 상태"로 본다
export function isLoggedIn(): boolean {
  return getAccessToken() !== null;
}

// 우리 앱의 문만 닫는다(로컬 토큰 삭제). Authentik 문 닫기는 login.ts의 startLogout이 담당.
export function clearLocalTokens(): void {
  sessionStorage.removeItem(ACCESS);
  sessionStorage.removeItem(ID);
}

// JWT groups 클레임으로 관리자 여부를 판별한다.
// Authentik에서 admin 그룹 멤버는 access_token의 groups claim에 "admin"이 포함된다.
// 토큰이 없거나 파싱에 실패하면 false를 반환(fail-closed).
export function isAdminUser(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Array.isArray(payload.groups) && payload.groups.includes('admin');
  } catch {
    return false;
  }
}
