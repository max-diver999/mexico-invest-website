#!/usr/bin/env python3
"""
Upload Mexico project images (manifest) to Cloudinary.

Folder: more-group/mexico/projects/{slug}/
Public IDs: hero, inline_1, inline_2

Reads credentials from mexico-invest-website/.env.local or ../more-group-website/.env.local

Usage:
  python3 scripts/upload-mexico-cloudinary.py --dry-run
  python3 scripts/upload-mexico-cloudinary.py --slug gran-tulum
  python3 scripts/upload-mexico-cloudinary.py
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import ssl
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ssl._create_default_https_context = ssl._create_unverified_context

ROOT = Path(__file__).resolve().parents[1]
MANIFEST_IN = Path(__file__).resolve().parent / "mexico-project-images-all.json"
MANIFEST_OUT = Path(__file__).resolve().parent / "mexico-cloudinary-manifest.json"

CLOUD = "dphvjbqb4"
FOLDER_BASE = "more-group/mexico/projects"
UPLOAD_WORKERS = 3
RATE_SLEEP = 0.15
MAX_UPLOAD_BYTES = 9_500_000

ROLE_PUBLIC = {"hero": "hero", "inline-1": "inline_1", "inline-2": "inline_2"}


def compress_image_bytes(data: bytes) -> bytes:
    """Shrink oversized JPEG/PNG for Cloudinary 10MB limit (macOS sips)."""
    if len(data) <= MAX_UPLOAD_BYTES:
        return data
    tmp = tempfile.NamedTemporaryFile(suffix=".jpg", delete=False)
    path = tmp.name
    tmp.write(data)
    tmp.close()
    try:
        for max_dim in (2200, 1800, 1400, 1100):
            subprocess.run(["sips", "-Z", str(max_dim), path], check=False, capture_output=True)
            subprocess.run(
                ["sips", "-s", "format", "jpeg", "-s", "formatOptions", "78", path],
                check=False,
                capture_output=True,
            )
            out = Path(path).read_bytes()
            if len(out) <= MAX_UPLOAD_BYTES:
                print(f"    compressed {len(data) // 1024}KB → {len(out) // 1024}KB")
                return out
        out = Path(path).read_bytes()
        return out if len(out) < len(data) else data
    finally:
        Path(path).unlink(missing_ok=True)


def load_env() -> tuple[str, str, str]:
    for env_path in (
        ROOT / ".env.local",
        ROOT.parent / "more-group-website" / ".env.local",
    ):
        if not env_path.exists():
            continue
        for line in env_path.read_text(encoding="utf-8").splitlines():
            m = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
            if m and not os.environ.get(m.group(1)):
                os.environ[m.group(1)] = m.group(2).strip().strip('"')
    cloud = os.environ.get("CLOUDINARY_CLOUD_NAME", CLOUD)
    key = os.environ.get("CLOUDINARY_API_KEY", "")
    secret = os.environ.get("CLOUDINARY_API_SECRET", "")
    if not key or not secret:
        sys.exit(
            "Missing CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET in .env.local "
            "(mexico-invest-website or more-group-website)"
        )
    return cloud, key, secret


def download_bytes(url: str) -> bytes | None:
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (MORE Group)"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if attempt:
                return None
            time.sleep(0.5)
        except Exception:
            if attempt:
                return None
            time.sleep(0.5)
    return None


def cloudinary_upload(
    image_bytes: bytes,
    folder: str,
    public_id: str,
    cloud: str,
    api_key: str,
    api_secret: str,
) -> str | None:
    timestamp = str(int(time.time()))
    full_public_id = f"{folder}/{public_id}"
    sig_str = f"overwrite=true&public_id={full_public_id}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(sig_str.encode()).hexdigest()
    boundary = "----MGMexicoBoundary"

    def field(name: str, value: str) -> bytes:
        return (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'
            f"{value}\r\n"
        ).encode()

    body = b""
    body += field("api_key", api_key)
    body += field("timestamp", timestamp)
    body += field("signature", signature)
    body += field("public_id", full_public_id)
    body += field("overwrite", "true")
    body += (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="image.jpg"\r\n'
        f"Content-Type: application/octet-stream\r\n\r\n"
    ).encode()
    body += image_bytes
    body += f"\r\n--{boundary}--\r\n".encode()

    upload_url = f"https://api.cloudinary.com/v1_1/{cloud}/image/upload"
    req = urllib.request.Request(
        upload_url,
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            result = json.loads(resp.read())
            return result.get("secure_url")
    except urllib.error.HTTPError as e:
        err = e.read().decode(errors="replace")
        print(f"    Cloudinary HTTP {e.code}: {err[:180]}")
        return None
    except Exception as e:
        print(f"    Cloudinary error: {e}")
        return None


def cdn_delivery_url(cloud: str, folder: str, public_id: str, fmt: str = "jpg") -> str:
    return f"https://res.cloudinary.com/{cloud}/image/upload/{folder}/{public_id}.{fmt}"


def load_existing_manifest() -> dict:
    if not MANIFEST_OUT.exists():
        return {"uploaded": {}, "failed": []}
    return json.loads(MANIFEST_OUT.read_text(encoding="utf-8"))


def save_manifest(data: dict) -> None:
    MANIFEST_OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def upload_one(job: dict) -> dict:
    slug, role, source_url, alt, cloud, key, secret, dry_run = (
        job[k]
        for k in ("slug", "role", "source_url", "alt", "cloud", "key", "secret", "dry_run")
    )
    public_id = ROLE_PUBLIC.get(role, role.replace("-", "_"))
    folder = f"{FOLDER_BASE}/{slug}"

    if dry_run:
        return {"slug": slug, "role": role, "ok": True, "secure_url": cdn_delivery_url(cloud, folder, public_id)}

    img = download_bytes(source_url)
    if not img:
        return {"slug": slug, "role": role, "ok": False, "error": "download_failed", "source_url": source_url}

    img = compress_image_bytes(img)

    url = cloudinary_upload(img, folder, public_id, cloud, key, secret)
    time.sleep(RATE_SLEEP)
    if url:
        return {
            "slug": slug,
            "role": role,
            "ok": True,
            "secure_url": url,
            "source_url": source_url,
            "alt": alt,
            "public_id": f"{folder}/{public_id}",
        }
    return {"slug": slug, "role": role, "ok": False, "error": "upload_failed", "source_url": source_url}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--slug", action="append", default=[])
    parser.add_argument("--workers", type=int, default=UPLOAD_WORKERS)
    args = parser.parse_args()

    cloud, key, secret = load_env()
    articles = json.loads(MANIFEST_IN.read_text(encoding="utf-8"))["articles"]
    if args.slug:
        articles = [a for a in articles if a["slug"] in args.slug]

    existing = load_existing_manifest()
    uploaded = existing.get("uploaded", {})

    jobs = []
    for article in articles:
        slug = article["slug"]
        for img in article["images"]:
            role = img["role"]
            key_id = f"{slug}:{role}"
            if key_id in uploaded and uploaded[key_id].get("secure_url"):
                continue
            jobs.append(
                {
                    "slug": slug,
                    "role": role,
                    "source_url": img["url"],
                    "alt": img.get("alt", ""),
                    "cloud": cloud,
                    "key": key,
                    "secret": secret,
                    "dry_run": args.dry_run,
                }
            )

    print(f"Mexico Cloudinary upload — {len(articles)} projects, {len(jobs)} images to upload")
    if not jobs:
        print("Nothing to upload (manifest complete).")
        return

    ok = fail = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(upload_one, j): j for j in jobs}
        for fut in as_completed(futures):
            j = futures[fut]
            res = fut.result()
            label = f"{res['slug']}:{res['role']}"
            if res.get("ok"):
                ok += 1
                uploaded[f"{res['slug']}:{res['role']}"] = res
                print(f"  ✓ {label}")
            else:
                fail += 1
                existing.setdefault("failed", []).append(res)
                print(f"  ✗ {label} — {res.get('error', 'unknown')}")

    existing["uploaded"] = uploaded
    existing["cloud"] = cloud
    existing["folder_base"] = FOLDER_BASE
    existing["generatedAt"] = time.strftime("%Y-%m-%d")
    if not args.dry_run:
        save_manifest(existing)

    print(f"\nDone: {ok} ok, {fail} failed → {MANIFEST_OUT.name}")


if __name__ == "__main__":
    main()
