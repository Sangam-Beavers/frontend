# 프로젝트 개요

외국인 근로자를 위한 금융 플랫폼 프론트엔드

- 송금 서비스
- 법률 상담 챗봇
- 커뮤니티

## 기술 스택

- React 19 + TypeScript
- Vite
- pnpm
- ESLint + Prettier + Husky + lint-staged + commitlint

## 폴더 구조

src/
├── assets/ # 이미지, 폰트, 아이콘
├── components/ # 공통 재사용 컴포넌트
├── pages/ # 라우트별 페이지 컴포넌트
├── hooks/ # 커스텀 훅
├── services/ # API 호출 함수
├── stores/ # 전역 상태 관리
├── types/ # TypeScript 타입/인터페이스
├── utils/ # 공통 유틸 함수
└── constants/ # 상수값 (API URL, 코드값 등)

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
