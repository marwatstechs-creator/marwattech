#!/usr/bin/env python3
"""Generate a hardened /opt/supabase/docker/.env from .env.example.

Runs on the VPS so secrets are generated there and never traverse chat.
Usage: python3 gen_supabase_env.py /opt/supabase/docker
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sys
import time

DIR = sys.argv[1] if len(sys.argv) > 1 else "/opt/supabase/docker"
EXAMPLE = os.path.join(DIR, ".env.example")
OUT = os.path.join(DIR, ".env")


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_jwt(secret: str, role: str, iss: str = "supabase") -> str:
    header = b64url(json.dumps({"alg": "HS256", "typ": "JWT"}, separators=(",", ":")).encode())
    now = int(time.time())
    payload = b64url(
        json.dumps(
            {"role": role, "iss": iss, "iat": now, "exp": now + 60 * 60 * 24 * 365 * 10},
            separators=(",", ":"),
        ).encode()
    )
    signing_input = f"{header}.{payload}".encode()
    sig = b64url(hmac.new(secret.encode(), signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def generate() -> dict:
    jwt_secret = secrets.token_urlsafe(48)  # 64 chars, >=32 required
    return {
        "POSTGRES_PASSWORD": secrets.token_urlsafe(32),
        "JWT_SECRET": jwt_secret,
        "ANON_KEY": make_jwt(jwt_secret, "anon"),
        "SERVICE_ROLE_KEY": make_jwt(jwt_secret, "service_role"),
        "DASHBOARD_USERNAME": "admin",
        "DASHBOARD_PASSWORD": secrets.token_urlsafe(16),
        "PG_META_CRYPTO_KEY": secrets.token_urlsafe(32),
        "SUPABASE_PUBLIC_URL": "https://supabase-api.marwattech.com",
        "SITE_URL": "https://www.marwattech.com",
        "ADDITIONAL_REDIRECT_URLS": (
            "https://marwattech.com,https://marwattech-company.marwatstechs.workers.dev,"
            "http://localhost:3000"
        ),
        "API_EXTERNAL_URL": "https://supabase-api.marwattech.com/auth/v1",
        # Reuse the app's existing cPanel SMTP server for auth emails.
        "SMTP_ADMIN_EMAIL": "no-reply@marwattech.com",
        "SMTP_HOST": "mail.marwattech.com",
        "SMTP_PORT": "465",
        "SMTP_SECURE": "true",
        "SMTP_USER": "no-reply@marwattech.com",
        "SMTP_PASS": "CHANGE_ME_SMTP_PASSWORD",  # user pastes the real password
        "SMTP_SENDER_NAME": "Marwat Tech",
    }


def apply(lines: list, updates: dict) -> list:
    """Replace single-line KEY=... entries; keep ordering."""
    keys = list(updates.keys())
    pats = {k: re.compile(rf"^\s*{re.escape(k)}=.*$", re.MULTILINE) for k in keys}
    text = "\n".join(lines)
    for k in keys:
        if pats[k].search(text):
            text = pats[k].sub(f"{k}={updates[k]}", text, count=1)
        else:
            text += f"\n{k}={updates[k]}"
    # strip any accidental trailing whitespace-only lines
    return text.split("\n")


def main():
    with open(EXAMPLE, "r") as f:
        lines = f.read().split("\n")
    updates = generate()
    out_lines = apply(lines, updates)
    with open(OUT, "w") as f:
        f.write("\n".join(out_lines) + "\n")
    os.chmod(OUT, 0o600)
    print(f"Wrote {OUT}")
    print("Set keys:", ", ".join(sorted(updates.keys())))
    print("Value lengths:", {k: len(str(v)) for k, v in updates.items()})


if __name__ == "__main__":
    main()
