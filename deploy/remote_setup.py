#!/usr/bin/env python3
"""
Server provisioning over SSH. Password only via env (never commit).

  pip install -r deploy/requirements-deploy.txt
  PowerShell: $env:DEPLOY_PASSWORD='...'; python deploy/remote_setup.py
"""

from __future__ import annotations

import base64
import os
import subprocess
import sys
from pathlib import Path

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "167.71.53.238")
USER = os.environ.get("DEPLOY_USER", "root")
APP = os.environ.get("DEPLOY_APP_PATH", "/opt/baazgo/app")
REPO = os.environ.get(
    "DEPLOY_REPO_URL", "https://github.com/aiziyrak-coder/baazgo.git"
)


def die(msg: str, code: int = 1) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(code)


def ensure_local_keypair() -> tuple[Path, Path]:
    root = Path(__file__).resolve().parents[1] / ".deploy" / "ssh"
    root.mkdir(parents=True, exist_ok=True)
    key = root / "baazgo_ed25519"
    pub = key.with_suffix(".pub")
    if not key.exists():
        subprocess.run(
            ["ssh-keygen", "-t", "ed25519", "-f", str(key), "-N", "", "-q"],
            check=True,
        )
    return key, pub


def run(client: paramiko.SSHClient, cmd: str, check: bool = True) -> tuple[str, str]:
    _stdin, stdout, stderr = client.exec_command(cmd)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if check and code != 0:
        die(f"Remote command failed ({code}): {cmd}\n{err}\n{out}")
    return out, err


def install_pubkey_exec_only(client: paramiko.SSHClient, pubkey_line: str) -> None:
    """Some hosts disable SFTP subsystem; use shell + base64 only."""
    b64 = base64.b64encode(pubkey_line.strip().encode()).decode("ascii")
    inner = (
        "mkdir -p /root/.ssh && chmod 700 /root/.ssh && "
        "touch /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys && "
        f'PK=$(echo "{b64}" | base64 -d) && '
        '(grep -qxF "$PK" /root/.ssh/authorized_keys || echo "$PK" >> /root/.ssh/authorized_keys)'
    )
    run(client, "bash -lc " + repr(inner))


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    password = os.environ.get("DEPLOY_PASSWORD")
    if not password:
        die("Set environment variable DEPLOY_PASSWORD for the first connection.")

    _, pub_path = ensure_local_keypair()
    pubkey_line = pub_path.read_text(encoding="utf-8").strip()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        HOST,
        username=USER,
        password=password,
        timeout=60,
        banner_timeout=60,
        auth_timeout=60,
        allow_agent=False,
        look_for_keys=False,
    )

    try:
        run(client, "mkdir -p /root/.ssh && chmod 700 /root/.ssh")
        install_pubkey_exec_only(client, pubkey_line)

        run(client, f"mkdir -p $(dirname {APP})")
        _o, _e = run(client, f"test -d {APP}/.git || git clone {REPO} {APP}", check=False)
        run(
            client,
            f"cd {APP} && git fetch origin && git checkout main && git reset --hard origin/main",
        )

        out, _err = run(client, "command -v node >/dev/null && node -v || echo MISSING_NODE")
        if "MISSING_NODE" in out:
            die(
                "Node.js is not installed on the server. Install Node 20+, then re-run this script."
            )

        run(client, f"chmod +x {APP}/deploy/bootstrap-server.sh")
        out, err = run(client, f"cd {APP} && bash deploy/bootstrap-server.sh")
        print(out)
        if err:
            print(err, file=sys.stderr)

        key_priv = pub_path.parent / "baazgo_ed25519"
        print("\n--- Done ---")
        print("Test: curl -s https://baazgoapi.ziyrak.org/api/health")
        print(f"GitHub Actions secret DEPLOY_SSH_KEY (private key file):\n  {key_priv}")
    finally:
        client.close()


if __name__ == "__main__":
    main()
