#!/usr/bin/env python3
"""
Pull latest git, reload HTTP+acme nginx, run certbot (webroot), switch to HTTPS nginx sites.

Requires SSH key from remote_setup.py:
  .deploy/ssh/baazgo_ed25519

Optional: LE_EMAIL (default admin@ziyrak.org)
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "167.71.53.238")
USER = os.environ.get("DEPLOY_USER", "root")
APP = os.environ.get("DEPLOY_APP_PATH", "/opt/baazgo/app")
EMAIL = os.environ.get("LE_EMAIL", "admin@ziyrak.org")


def key_path() -> Path:
    p = os.environ.get("DEPLOY_SSH_KEY")
    if p:
        return Path(p)
    return Path(__file__).resolve().parents[1] / ".deploy" / "ssh" / "baazgo_ed25519"


def run(client: paramiko.SSHClient, cmd: str, check: bool = True) -> tuple[str, str]:
    _stdin, stdout, stderr = client.exec_command(cmd)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print(out, end="")
    if err:
        print(err, end="", file=sys.stderr)
    if check and code != 0:
        raise SystemExit(code)
    return out, err


def main() -> None:
    kp = key_path()
    if not kp.is_file():
        print("Missing SSH key:", kp, file=sys.stderr)
        raise SystemExit(1)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        key_filename=str(kp),
        timeout=90,
        banner_timeout=90,
        auth_timeout=90,
        allow_agent=False,
        look_for_keys=False,
    )
    try:
        script = f"""set -euo pipefail
mkdir -p /var/www/html
cd {APP}
git fetch origin
git checkout main
git reset --hard origin/main

install -m 644 {APP}/deploy/nginx/baazgo-frontend.http.conf /etc/nginx/sites-available/baazgo-frontend.conf
install -m 644 {APP}/deploy/nginx/baazgo-api.http.conf /etc/nginx/sites-available/baazgo-api.conf
ln -sf /etc/nginx/sites-available/baazgo-frontend.conf /etc/nginx/sites-enabled/50-baazgo-frontend.conf
ln -sf /etc/nginx/sites-available/baazgo-api.conf /etc/nginx/sites-enabled/50-baazgo-api.conf
nginx -t
systemctl reload nginx

certbot certonly --webroot -w /var/www/html \\
  -d baazgo.ziyrak.org -d baazgoapi.ziyrak.org \\
  --agree-tos --non-interactive --email {EMAIL}

install -m 644 {APP}/deploy/nginx/baazgo-frontend.conf /etc/nginx/sites-available/baazgo-frontend.conf
install -m 644 {APP}/deploy/nginx/baazgo-api.conf /etc/nginx/sites-available/baazgo-api.conf
nginx -t
systemctl reload nginx
systemctl restart baazgo-api || true
"""
        run(client, f"bash -lc {repr(script)}")
        print("HTTPS rollout complete.")
    finally:
        client.close()


if __name__ == "__main__":
    main()
