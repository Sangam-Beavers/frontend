#!/bin/sh
# ─────────────────────────────────────────────────────────────
# 런타임 환경변수 치환
# - Vite는 빌드 시점에 VITE_* 를 정적 문자열로 박아넣음
# - 빌드 시 placeholder (__OIDC_CLIENT_ID__ 등) 박고
# - 컨테이너 시작 시 컨테이너의 환경변수로 sed 치환
# - 같은 이미지로 dev/stage/prod 다 사용 가능
# ─────────────────────────────────────────────────────────────
set -e

ROOT="/usr/share/nginx/html"

# 치환할 placeholder 목록 — .env.production과 동일하게 유지
PLACEHOLDERS="
__OIDC_CLIENT_ID__
__OIDC_AUTHORIZE_ENDPOINT__
__OIDC_TOKEN_ENDPOINT__
__OIDC_REDIRECT_URI__
__OIDC_END_SESSION_ENDPOINT__
__OIDC_POST_LOGOUT_REDIRECT_URI__
__SKIP_AUTH__
"

# 각 placeholder를 같은 이름의 환경변수 값으로 치환
for ph in $PLACEHOLDERS; do
  # __FOO_BAR__ → FOO_BAR 환경변수 이름
  var_name=$(echo "$ph" | sed 's/^__//' | sed 's/__$//')
  var_value=$(eval echo \$$var_name)

  if [ -z "$var_value" ]; then
    echo "[entrypoint] WARN: $var_name 환경변수 미설정 — placeholder 유지: $ph"
    continue
  fi

  echo "[entrypoint] $ph → $var_value"

  # /를 이스케이프해야 sed가 URL 처리 가능
  escaped_value=$(echo "$var_value" | sed 's/[\/&]/\\&/g')

  # html 디렉토리의 모든 .js, .html 파일에서 치환
  find "$ROOT" -type f \( -name "*.js" -o -name "*.html" -o -name "*.css" \) \
    -exec sed -i "s/$ph/$escaped_value/g" {} +
done

echo "[entrypoint] 치환 완료 — nginx 시작"

# nginx의 proxy_params.conf가 없으면 만들어줌 (alpine 기본 이미지엔 없음)
if [ ! -f /etc/nginx/proxy_params.conf ]; then
  cat > /etc/nginx/proxy_params.conf <<'EOF'
proxy_http_version 1.1;
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
proxy_read_timeout 300s;
proxy_connect_timeout 30s;
EOF
fi

# 원래 명령 실행 (CMD: nginx -g 'daemon off;')
exec "$@"
