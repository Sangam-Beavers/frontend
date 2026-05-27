# 프로젝트 개요

외국인 근로자를 위한 금융 플랫폼 프론트엔드

## 기술 스택

- React 19 + TypeScript
- Vite + pnpm
- ESLint + Prettier + Husky

## 폴더 구조

- src/components: 공통 컴포넌트
- src/pages: 페이지 컴포넌트
- src/services: API 호출
- src/types: 타입 정의
- src/stores: 전역 상태

## 코딩 규칙

- 함수형 컴포넌트만 사용
- Props 타입은 interface로 정의
- API 호출은 services/ 폴더에서만
- 절대경로 사용 (`@/components/Button`)
- 환경변수는 `VITE_` 접두사 사용

## 커밋 컨벤션

타입: 내용 형식으로 작성

| 타입     | 설명          |
| -------- | ------------- |
| Init     | 프로젝트 시작 |
| Feature  | 새로운 기능   |
| Fix      | 버그 수정     |
| Style    | UI 스타일     |
| Refactor | 코드 리팩터링 |
| Chore    | 설정 변경     |
| Docs     | 문서 수정     |
| Test     | 테스트 코드   |
| Build    | 빌드 관련     |
| Ci       | CI 설정       |
| Release  | 릴리즈        |
| Plus     | 의존성 추가   |
| Minus    | 의존성 제거   |

예시: `Feature: 송금 폼 컴포넌트 추가`

## 브랜치 전략

- `main`: 운영 배포용, 직접 push 금지
- `develop`: 개발 통합 브랜치
- `feat/기능명`: 기능 개발
- `fix/버그명`: 버그 수정

## 환경변수

`.env.example` 참고해서 `.env.development` 파일 로컬에 생성 후 사용

## 반응형 규칙

- 모바일 기준 최대 width 430px
- 가운데 정렬, 좌우 여백은 배경색으로 채워줘
- 태블릿/데스크탑에서도 모바일 앱처럼 보이게 구현
- App.tsx에 전체 레이아웃 컨테이너 적용

## Claude 행동 지침

### 파괴적인 작업 — 실행 전 반드시 사용자 확인 필요

- `git push --force` / `--force-with-lease`
- `git reset --hard`
- `git rebase` (공유 브랜치인 develop, main)
- 파일 또는 폴더 삭제
- `pnpm remove` (의존성 제거)
- `.env` 관련 파일 수정
- `main`, `develop` 브랜치에 직접 커밋 또는 push

### 커밋 / PR 규칙

- 커밋 전 변경된 파일 목록을 반드시 먼저 보여줄 것
- `main` 브랜치에는 직접 push 금지
- PR 없이 `develop`에 직접 push 금지
- 커밋 메시지는 CLAUDE.md의 커밋 컨벤션을 따를 것

### 코드 작업 규칙

- 여러 파일을 동시에 수정할 경우 계획을 먼저 제시할 것
- 새 패키지 설치 전 필요성과 대안을 먼저 설명할 것
- 기존 코드를 대규모로 리팩터링하기 전 범위를 먼저 공유할 것
