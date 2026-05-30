/// <reference types="vite/client" />

// .env.local 에 넣은 VITE_ 값들의 "타입"을 TypeScript에 알려주는 파일.
// 이게 있어야 import.meta.env.VITE_OIDC_CLIENT_ID 같은 걸 쓸 때
// 에디터가 빨간 줄을 안 긋고 자동완성도 됨.
interface ImportMetaEnv {
  readonly VITE_OIDC_CLIENT_ID: string;
  readonly VITE_OIDC_AUTHORIZE_ENDPOINT: string;
  readonly VITE_OIDC_TOKEN_ENDPOINT: string;
  readonly VITE_OIDC_REDIRECT_URI: string;
  readonly VITE_OIDC_SCOPE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SKIP_AUTH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
