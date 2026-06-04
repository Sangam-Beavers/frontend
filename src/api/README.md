# API 연동 가이드 (프론트엔드 팀 표준)

백엔드 API 한 개를 화면에 붙일 때 따라 하는 표준 패턴. **새 도메인/엔드포인트 추가 시 본 문서를 그대로 복제**하면 일관성이 유지된다.

레퍼런스 구현체: `src/hooks/useQna.ts` + `src/pages/community/Job/CommunityJobPage.tsx` (주요 QnA 카드).

---

## 0. 큰 그림

```
백엔드 ApiResponse                axios interceptor                  컴포넌트
{ success, data, message }   →   .data만 추출해서 반환        →    const { data, isLoading } = useXxx()
{ success: false, code, ... } →  ApiException(code, status, msg) →  catch (e instanceof ApiException)
```

- **호출 측은 envelope을 의식하지 않는다** — 항상 `data`(실제 도메인 객체)만 받는다.
- 실패는 항상 `ApiException`으로 throw. `e.code`로 비즈니스 분기.

---

## 1. 새 도메인 연동 — 6단계 체크리스트

### Step 1. 백엔드 API 명세 확인

- Swagger UI: `http://localhost:{8081|8082|8083|8084}/swagger-ui/index.html`
- 도메인 문서: `gb-backend/docs/{도메인}/api-spec.md`
- 인증 필요 여부, path, query, body, 응답 DTO, 에러 코드 확인

### Step 2. (백엔드 DTO 바뀌었으면) 타입 재생성

```bash
# 백엔드 4개 서비스 모두 띄운 상태에서
pnpm gen:types              # 4개 한꺼번에
# 또는 변경된 서비스만
pnpm gen:types:wallet
```

결과: `src/types/api/{서비스}.ts`. `components['schemas']['{DtoName}']`로 사용 가능.

### Step 3. API 함수 추가 — `src/api/{서비스}.ts`

```typescript
// src/api/wallet.ts
export const walletApi = {
  ...
  // GET — params, query string
  getBalance: () =>
    apiClient.get<unknown, BalanceResponse>('/wallets/me/balances'),

  // POST — body 전달
  registerAccount: (body: RegisterAccountRequest) =>
    apiClient.post<unknown, RegisterAccountResponse>('/wallets/accounts', body),

  // PATCH — path variable + body
  updateAccount: (publicId: string, body: UpdateAccountRequest) =>
    apiClient.patch<unknown, AccountResponse>(`/wallets/accounts/${publicId}`, body),

  // DELETE — path variable
  deleteAccount: (publicId: string) =>
    apiClient.delete<unknown, void>(`/wallets/accounts/${publicId}`),
};
```

**`<unknown, ReturnType>` 패턴**: axios 제네릭이 `<TBodyType, TResponseType>`인데, interceptor가 envelope을 풀어버리므로 실제 반환 타입은 두 번째 인자에 명시한다.

### Step 4. TanStack Query hook — `src/hooks/use{Resource}.ts`

#### 4-1. 조회 (useQuery)

```typescript
// src/hooks/useBalance.ts
import { useQuery } from '@tanstack/react-query';
import { walletApi, type BalanceResponse } from '@/api/wallet';

export const useBalance = () =>
  useQuery<BalanceResponse>({
    queryKey: ['wallet', 'balance'],
    queryFn: () => walletApi.getBalance(),
    staleTime: 0, // 잔액은 항상 최신 → 기본 30초 캐시 override
  });
```

#### 4-2. 변경 (useMutation)

```typescript
// src/hooks/useRegisterAccount.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useRegisterAccount = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterAccountRequest) => walletApi.registerAccount(body),
    onSuccess: () => {
      // 계좌 목록 invalidate → 자동 재요청
      qc.invalidateQueries({ queryKey: ['wallet', 'accounts'] });
    },
  });
};
```

### Step 5. 페이지 적용

#### 5-1. 조회 패턴

```typescript
const { data, isLoading, error } = useBalance();

if (isLoading) return <div>로딩…</div>;
if (error) return <div>오류: {error.message}</div>;
// 정상 — data 사용
return <div>잔액: {data?.balance}</div>;
```

#### 5-2. 변경 패턴

```typescript
const { mutate, isPending, error } = useRegisterAccount();

const onSubmit = () => {
  mutate(
    { bankCode: '020', accountNumber: '...' },
    {
      onSuccess: (data) => navigate('/account-registered'),
      onError: (err) => {
        if (err instanceof ApiException && err.code === 'ACCOUNT4002') {
          alert('이미 등록된 계좌입니다.');
        }
      },
    }
  );
};
```

### Step 6. 에러 코드 분기 (필요 시)

`ApiException`은 `code`(비즈니스 에러 코드)와 `httpStatus`를 들고 있다.

```typescript
import { ApiException } from '@/api';

try {
  await walletApi.execute(...);
} catch (e) {
  if (e instanceof ApiException) {
    switch (e.code) {
      case 'WALLET4001': alert('잔액이 부족합니다.'); break;
      case 'TRANSFER4006': alert('요청이 너무 잦습니다. 잠시 후 다시 시도하세요.'); break;
      default: alert(e.message);
    }
  }
}
```

에러 코드 SSOT는 백엔드 도메인 문서 (`gb-backend/docs/{domain}/api-spec.md` 의 "에러 코드" 표).

---

## 2. 규약 (반드시 지킬 것)

### queryKey 규약

- `[도메인, 리소스, ...파라미터]` 순서. 예:
  - `['wallet', 'balance']`
  - `['wallet', 'transactions', { page, size }]`
  - `['community', 'qna', { category, size }]`
- 도메인 prefix 통일로 invalidate 범위 제어 가능 (`['wallet']`로 wallet 전체 무효화).

### staleTime 가이드

| 종류                      | staleTime       | 이유         |
| ------------------------- | --------------- | ------------ |
| 잔액·송금가능액           | `0`             | 항상 최신    |
| 거래/송금 내역            | `30_000` (기본) | 보통         |
| 카테고리·환율 같은 마스터 | `5 * 60_000`    | 자주 안 바뀜 |

### mutation 자동 retry 금지 (이미 main.tsx 기본)

- 송금·결제·계좌 등록 같은 mutation은 중복 실행 위험. 자동 재시도 X.
- 명시적으로 사용자가 다시 누를 때만 실행.

### snake_case ↔ camelCase

- 백엔드는 snake_case 응답 (`public_id`, `comment_count`).
- 프론트는 그대로 받아 사용. 변환 X — 추가 매핑 코드가 오히려 버그.
- 타입 자동 생성도 snake_case 그대로 (OpenAPI 스펙 따름).

### 인증 토큰

- `src/api/client.ts`의 request interceptor가 매 요청마다 `sessionStorage`의 access_token을 `Authorization: Bearer` 헤더로 자동 부착.
- hook이나 페이지에서 직접 헤더 조작 금지.
- 401 응답 시 자동으로 `clearLocalTokens()` + `/login`으로 리다이렉트 (interceptor가 처리).
- 인증 흐름 상세는 [§6 인증 통합](#6-인증-통합-pkce--apiclient) 참고.

---

## 3. 흔한 함정

1. **`.data` 한 번 더 쓰지 말기** — interceptor가 이미 풀어줌. `res.data.posts` X → `res.posts` O
2. **mock과 실 API 형식 불일치** — mock이 `isSuccess/result` 쓰면 교체 시 코드 다 깨짐. mock도 백엔드 envelope 따르도록 통일 (별도 사이클 작업 중)
3. **queryKey에 함수/객체 ref 넣기 금지** — 매 렌더마다 새 ref라 무한 재요청. 원시 값(string, number, primitive object)만
4. **mutation에 useQuery 쓰기** — useQuery는 read-only. POST/PATCH/DELETE는 useMutation
5. **에러 메시지 백엔드 message 그대로 노출** — 개발자 친화적 메시지인 경우 많음. 사용자용은 별도 매핑 (위 Step 6)

---

## 4. 폴더 구조 정리

```
src/
├── api/                        # axios 인스턴스 + 도메인별 API 함수
│   ├── client.ts               # axios + interceptor + ApiException
│   ├── community.ts            # communityApi.getQna() 등
│   ├── member.ts
│   ├── wallet.ts
│   ├── document.ts
│   ├── index.ts                # re-export
│   └── README.md               # ← 본 문서
│
├── hooks/                      # TanStack Query custom hooks
│   ├── useQna.ts               # 레퍼런스
│   ├── useBalance.ts           # (다음 작업)
│   └── ...
│
├── types/api/                  # OpenAPI 자동 생성 결과물
│   ├── community.ts
│   ├── wallet.ts
│   ├── member.ts
│   ├── document.ts
│   └── README.md
│
├── pages/                      # 페이지 컴포넌트 — hook을 호출
├── stores/                     # Zustand (토큰·사용자·UI 상태)
└── ...
```

---

## 5. 다음 단계

- **mock 정리**: 별도 사이클에서 mocks/\* 응답을 백엔드 envelope으로 통일 + 페이지 `.result` → `.data` 일괄 수정
- **에러 메시지 사전**: `src/api/errorMessages.ts`로 `{ code: 사용자메시지 }` 매핑 (반복되면 hook으로 추출)
- **refresh token + silent renew**: 현재 401이면 즉시 로그인 페이지로 보냄. 향후 refresh_token으로 renew 시도 후 실패 시에만 이동

---

## 6. 인증 통합 (PKCE + apiClient)

### 6-1. 흐름 전체

```
[로그인 버튼] → startLogin()         (auth/login.ts)
                ├ verifier/state 생성 (PKCE)
                ├ sessionStorage 보관
                └ window.location → Authentik authorize endpoint

[Authentik 로그인 화면] (사용자가 직접 입력)
                ↓ 성공
[Callback 화면] /auth/callback?code=...&state=...
                ├ state 대조 (CSRF 방어)
                ├ code + verifier → token endpoint POST
                ├ saveTokens() → sessionStorage
                └ navigate('/')

[모든 API 호출] apiClient.get/post/...
                ├ request interceptor: getAccessToken() → Bearer 부착
                ├ 200 → envelope 풀어 data 반환
                └ 401 → clearLocalTokens + /login redirect
```

### 6-2. 폴더 분담

| 폴더                            | 책임                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/auth/`                     | OIDC 메커니즘 (config / pkce / login / tokenStore) — 인증만 알고 백엔드 도메인 모름              |
| `src/api/client.ts`             | axios 인스턴스 + interceptor. 토큰을 **읽기 전용**으로 의존(`getAccessToken`/`clearLocalTokens`) |
| `src/pages/auth/Callback/`      | OIDC 콜백 화면 (code → 토큰 교환)                                                                |
| `src/routes/ProtectedRoute.tsx` | 라우트 가드 (`isLoggedIn()` + `VITE_SKIP_AUTH` 우회)                                             |

### 6-3. 새 인증 필요 API 추가 시

추가 작업 0. interceptor가 자동 부착하므로 도메인 API 함수는 평소처럼 작성:

```typescript
// src/api/wallet.ts — 인증 필요 API도 비인증 API와 동일하게 작성
getBalance: () => apiClient.get<unknown, BalanceResponse>('/wallets/me/balances'),
```

### 6-4. 환경변수 (.env.development / .env.example)

```
VITE_OIDC_CLIENT_ID=               # Authentik client id (인프라 팀 발급)
VITE_OIDC_AUTHORIZE_ENDPOINT=      # https://sso.sb.fisa/application/o/authorize/
VITE_OIDC_TOKEN_ENDPOINT=          # https://sso.sb.fisa/application/o/token/
VITE_OIDC_REDIRECT_URI=            # http://localhost:5173/auth/callback (IdP에 등록한 값과 일치)
VITE_OIDC_SCOPE=openid profile email
VITE_SKIP_AUTH=true                # 개발 초기 우회용 (PKCE 동작 확인 후 false 또는 제거)
```

운영기는 IdP만 Cognito로 바뀌고 변수 구조는 동일 — endpoint/client_id/redirect_uri만 갈아끼움.

### 6-5. 토큰 저장소 — sessionStorage

현재 `auth/tokenStore.ts`가 `sessionStorage` 사용 (탭 닫으면 사라짐).

| 항목          | 현재 (sessionStorage) | 권장 운영 (TODO)           |
| ------------- | --------------------- | -------------------------- |
| XSS 노출      | ⚠️ JS 접근 가능       | httpOnly cookie (BFF 패턴) |
| 탭 분리       | ✅ 탭마다 격리        | 동일                       |
| refresh token | ❌ 미사용             | silent renew 도입          |

운영 배포 전 보안 강화 필요 (`tokenStore.ts` 상단 TODO 참고).
