# syntax=docker/dockerfile:1.6
# ─────────────────────────────────────────────────────────────
# 1) Builder — pnpm install + tsc + vite build
# ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# pnpm 활성화 (Node 22 corepack 내장)
RUN corepack enable

# Husky를 CI에서는 skip (git hook 설치 불필요, .git 없을 수도 있음)
ENV HUSKY=0

# 의존성 캐시 레이어 (lock 파일만 먼저 복사)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 소스 전체 복사
COPY . .

# placeholder 박힌 .env.production.template을 .env.production으로 복사
# (.env.production은 .gitignore에 있으므로 repo엔 .template으로 보관, 빌드 시 rename)
RUN cp .env.production.template .env.production

# vite build는 자동으로 .env.production을 읽음
RUN pnpm build

# ─────────────────────────────────────────────────────────────
# 2) Runtime — nginx:alpine 정적 호스팅
# ─────────────────────────────────────────────────────────────
FROM nginx:alpine

# nginx 설정 교체
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 결과물 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 런타임 환경변수 치환 entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# 컨테이너 시작 시 placeholder를 실제 env로 sed 치환 후 nginx 시작
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
