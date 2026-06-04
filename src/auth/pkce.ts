// ─────────────────────────────────────────────────────────────
// auth/pkce.ts  —  PKCE("픽시") 보안 장치
// 비유:
//  - verifier = 내가 종이에 적어둔 "원본 비밀번호" (나만 가짐, 밖으로 안 보냄)
//  - challenge = 그걸 믹서기에 갈아버린 "요약본"  (밖에 보내도 됨, 되돌릴 수 없으니까)
// 흐름:
//  로그인 시작 → verifier 만들고 challenge 계산 → challenge만 Authentik에 보냄(verifier는 숨김)
//  토큰 교환 → verifier(원본)를 같이 보냄 → "갈았더니 아까 그 요약본 맞네?" 확인 → 진짜 나임 증명
//  그래서 중간에 code를 가로채도 verifier가 없으면 토큰으로 못 바꾼다.
// ─────────────────────────────────────────────────────────────

// 무작위 바이트 → base64url 문자열 (OAuth가 요구하는 형식. +,/,= 를 빼거나 바꿈)
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 안전한 무작위 문자열 (브라우저 기본 난수기 사용. Math.random은 보안용으로 부적합)
function randomString(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

// 1) verifier(원본) 만들기. 32바이트면 base64url로 약 43자라 표준 범위(43~128)에 맞음.
export function createCodeVerifier(): string {
  return randomString(32);
}

// 2) challenge(요약본) = verifier를 SHA-256으로 해시 후 base64url. ("S256" 방식)
//    해시는 결과를 Promise로 주므로 async 함수다.
export async function createCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier); // 문자열 → 바이트
  const digest = await crypto.subtle.digest('SHA-256', data); // 갈기(해시)
  return base64UrlEncode(new Uint8Array(digest));
}

// state = 위조(CSRF) 방지용 무작위 표식
export function createState(): string {
  return randomString(16);
}
