#!/usr/bin/env bash
# One-time setup on the VPS: clone/build, systemd API, new nginx sites only.
# Uses HTTP (80) nginx stubs so `nginx -t` passes before TLS exists.
# After certificates exist, copy deploy/nginx/baazgo-frontend.conf and
# deploy/nginx/baazgo-api.conf (HTTPS), run: nginx -t && systemctl reload nginx
#
# Usage (as root): bash deploy/bootstrap-server.sh

set -euo pipefail

APP="${DEPLOY_PATH:-/opt/baazgo/app}"
REPO="${DEPLOY_REPO_URL:-https://github.com/aiziyrak-coder/baazgo.git}"

mkdir -p "$(dirname "$APP")"
if [ ! -d "$APP/.git" ]; then
  git clone "$REPO" "$APP"
fi

cd "$APP"
git fetch origin
git checkout main
git reset --hard origin/main

npm ci

if [ ! -f "$APP/.env.api" ]; then
  cp deploy/env.api.template "$APP/.env.api"
  chmod 600 "$APP/.env.api"
fi

export VITE_API_BASE_URL="https://baazgoapi.ziyrak.org"
npm run build

install -m 644 deploy/systemd/baazgo-api.service /etc/systemd/system/baazgo-api.service

install -m 644 deploy/nginx/baazgo-frontend.http.conf /etc/nginx/sites-available/baazgo-frontend.conf
install -m 644 deploy/nginx/baazgo-api.http.conf /etc/nginx/sites-available/baazgo-api.conf

ln -sf /etc/nginx/sites-available/baazgo-frontend.conf /etc/nginx/sites-enabled/50-baazgo-frontend.conf
ln -sf /etc/nginx/sites-available/baazgo-api.conf /etc/nginx/sites-enabled/50-baazgo-api.conf

systemctl daemon-reload
systemctl enable --now baazgo-api

nginx -t
systemctl reload nginx

echo "BaazGo HTTP deploy OK. Issue TLS (example):"
echo "  certbot certonly --nginx -d baazgo.ziyrak.org -d baazgoapi.ziyrak.org"
echo "Then install HTTPS configs from deploy/nginx/baazgo-frontend.conf + baazgo-api.conf"
echo "(adjust ssl_certificate paths if certbot used different names)."
