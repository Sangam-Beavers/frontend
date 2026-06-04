# API 타입 자동 생성

백엔드 SpringDoc OpenAPI 스펙을 TypeScript 타입으로 변환한 결과물.

## 생성 방법

백엔드 4개 서비스가 로컬에 띄워져 있어야 함 (member:8081, community:8082, document:8083, wallet:8084).

```bash
# 4개 서비스 모두 생성
pnpm gen:types

# 또는 개별 서비스만
pnpm gen:types:member
pnpm gen:types:wallet
pnpm gen:types:community
pnpm gen:types:document
```

## 사용 방법

```typescript
import type { components } from '@/types/api/community';

// 응답 DTO 타입 추출
type QnaListResponse = components['schemas']['QnaListResponse'];
type QnaPostResponse = components['schemas']['QnaPostResponse'];
```

## 갱신 주기

- 백엔드 controller/DTO 변경 시 재실행 필요
- CI에 통합하면 자동화 가능 (별도 사이클)

## .gitignore 정책

- 자동 생성 결과물(`*.ts`)은 git에 커밋한다 (백엔드 띄우지 않고도 빌드 가능하도록)
- 본 README와 같은 폴더의 수동 작성 타입은 별도 관리
