// ─────────────────────────────────────────────────────────────
// auth/login.ts  —  ① 로그인 버튼이 부르는 함수
// 하는 일: PKCE 값(verifier/challenge)·state를 만들고,
//          사용자를 Authentik 로그인 페이지로 "이동"시킨다.
// (놀이공원 비유: 손님을 팔찌 발급소로 안내하는 단계)
//
// challenge 만드는 게 async(해시 계산)라 이 함수도 async 다.
// ─────────────────────────────────────────────────────────────

import { authConfig } from './config'; // 같은 auth 폴더의 config.ts
import { createCodeVerifier, createCodeChallenge, createState } from './pkce';

// verifier/state는 Authentik 갔다 돌아올 때까지 살아있어야 한다.
// 화면이 통째로 Authentik으로 넘어갔다 오므로 React 메모리로는 사라짐.
// → sessionStorage(그 탭에서만, 닫으면 사라지는 임시 보관함)에 잠깐 둔다.
const VERIFIER_KEY = 'pkce_code_verifier';
const STATE_KEY = 'oauth_state';

export async function startLogin(): Promise<void> {
  // 이번 로그인용 일회용 값들
  const verifier = createCodeVerifier(); // 원본(숨김)
  const challenge = await createCodeChallenge(verifier); // 요약본(보냄)
  const state = createState(); // 위조 방지 표식

  // 원본(verifier)·state는 우리만 보관. URL로 절대 안 내보냄.
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  sessionStorage.setItem(STATE_KEY, state);

  // Authentik에 넘길 쪽지들 (?a=1&b=2 형태로 만들어 줌)
  const params = new URLSearchParams({
    response_type: 'code', // "code 방식으로 줘"
    client_id: authConfig.clientId, // 우리 앱 ID
    redirect_uri: authConfig.redirectUri, // 끝나고 돌아올 주소
    scope: authConfig.scope, // 받고 싶은 정보
    state, // 위조 방지 표식
    code_challenge: challenge, // PKCE 요약본
    code_challenge_method: 'S256', // 요약 방식(SHA-256)
  });

  // 실제로 화면을 Authentik으로 이동시킨다. 여기서 우리 앱을 떠남.
  window.location.href = `${authConfig.authorizeEndpoint}?${params.toString()}`;
}

// Callback에서 꺼내 쓰도록 key 들을 내보낸다.
export const pkceStorageKeys = { VERIFIER_KEY, STATE_KEY };
