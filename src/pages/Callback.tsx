// ─────────────────────────────────────────────────────────────
// pages/Callback.tsx  —  ② 팔찌(토큰) 받는 화면
// Authentik이 로그인 끝내고 우리를 /auth/callback 으로 돌려보낼 때 뜬다.
// 버튼·입력칸이 없는 "처리 중" 대기 화면이고, 끝나면 홈으로 넘어간다.
//
// 하는 일:
//   1) 주소창에 붙어온 code, state 를 읽는다.   (.../callback?code=...&state=...)
//   2) state 가 보냈던 값과 같은지 확인한다(위조 방지).
//   3) code 를 Authentik 토큰 주소로 보내 "토큰"으로 바꾼다(fetch).
//   4) 토큰을 저장하고 홈으로 이동.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authConfig } from '@/auth/config';
import { pkceStorageKeys } from '@/auth/login';
import { saveTokens, type TokenResponse } from '@/auth/tokenStore';
import { ROUTES } from '@/constants/routes';

export default function Callback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  // React 개발모드는 useEffect 를 2번 실행한다(StrictMode).
  // code 교환은 딱 1번만 해야 하므로(코드는 1회용) 중복 실행을 막는 잠금.
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function run() {
      // 1) 주소창에서 값 꺼내기
      const url = new URLSearchParams(window.location.search);
      const code = url.get('code');
      const returnedState = url.get('state');

      if (!code) {
        setError('code가 없어. 로그인 주소가 잘못됐을 수 있어.');
        return;
      }

      // 2) state 대조 (보낼 때 저장한 값과 같아야 함)
      const savedState = sessionStorage.getItem(pkceStorageKeys.STATE_KEY);
      if (!returnedState || returnedState !== savedState) {
        setError('state가 안 맞아. 보안상 로그인을 중단했어.');
        return;
      }

      // 숨겨뒀던 verifier(PKCE 원본) 꺼내기
      const verifier = sessionStorage.getItem(pkceStorageKeys.VERIFIER_KEY);
      if (!verifier) {
        setError('verifier가 없어. 로그인을 처음부터 다시 시도해줘.');
        return;
      }

      // 3) code → 토큰 교환. Authentik 토큰 주소로 POST.
      //    형식은 OAuth 표준인 form 전송(application/x-www-form-urlencoded).
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: authConfig.redirectUri, // 보낼 때와 똑같아야 함
        client_id: authConfig.clientId,
        code_verifier: verifier, // ← PKCE 원본. challenge와 짝이 맞아야 통과
      });

      try {
        const res = await fetch(authConfig.tokenEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
        });

        if (!res.ok) {
          setError(`토큰 교환 실패 (${res.status})`);
          return;
        }

        // 4) 토큰 저장 + 정리 + 홈으로
        const tokens = (await res.json()) as TokenResponse;
        saveTokens(tokens);
        // 다 쓴 일회용 값 정리
        sessionStorage.removeItem(pkceStorageKeys.STATE_KEY);
        sessionStorage.removeItem(pkceStorageKeys.VERIFIER_KEY);
        navigate(ROUTES.HOME, { replace: true });
      } catch (e) {
        setError(`네트워크 오류: ${String(e)}`);
      }
    }

    run();
  }, [navigate]);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h3>로그인 실패</h3>
        <p style={{ color: '#d9534f' }}>{error}</p>
        <a href={ROUTES.LOGIN}>로그인 화면으로</a>
      </div>
    );
  }

  return <div style={{ padding: 24 }}>로그인 처리 중...</div>;
}
