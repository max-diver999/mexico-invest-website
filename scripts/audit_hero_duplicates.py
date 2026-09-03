#!/usr/bin/env python3
"""Find hero photographs that repeat across the corpus.

Two pages can carry the same picture without sharing a URL: the same stock
frame is uploaded once per page, so a check on the URL alone reports a clean
corpus while a reader scrolling a hub sees the same beach four times. This
compares the pixels, with an average hash over a downscaled greyscale copy.

An earlier version of this tool sampled the bytes of a small JPEG instead of
decoding it, to avoid the Pillow dependency. It found one repeat where there
were ten: compressed bytes are not a proxy for what a picture looks like.

    python3 scripts/audit_hero_duplicates.py [--collection projects] [--fail]

Requires Pillow. This is a review aid, not part of the build.
"""
import argparse, io, json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = os.getcwd()
CONTENT = os.path.join(ROOT, "src/content")
COLLECTIONS = ["guides", "projects", "areas", "compare", "news", "developers"]
GRID = 12          # 144-bit hash
THRESHOLD = 14     # bits of difference still counted as the same picture
CACHE = "/tmp/mx-hero-phash-cache.json"

CLOUD = re.compile(r"^https://res\.cloudinary\.com/([a-z0-9]+)/image/upload/(.+)$")
TRANSFORM = re.compile(
    r"^(?:a|ac|ar|b|bl|bo|br|c|co|cs|d|dn|dpr|du|e|eo|f|fl|fn|fps|g|h|if|ki|l|o|pg|q|r|so|t|u|vc|vs|w|x|y|z)_"
)


def thumb_url(src, px=96):
    m = CLOUD.match(src.strip())
    if not m:
        return None
    parts = [p for p in m.group(2).split("?")[0].split("/") if p]
    version = next((i for i, p in enumerate(parts) if re.fullmatch(r"v\d+", p)), None)
    if version is not None:
        delivery = parts[version:]
    else:
        i = 0
        while i < len(parts) - 1 and all(TRANSFORM.match(q) for q in parts[i].split(",")):
            i += 1
        delivery = parts[i:]
    return (f"https://res.cloudinary.com/{m.group(1)}/image/upload/"
            f"w_{px},h_{px},c_fill,g_center,q_auto:good,f_jpg/" + "/".join(delivery))


def entries(only=None):
    out = []
    for col in COLLECTIONS:
        if only and col != only:
            continue
        d = os.path.join(CONTENT, col)
        if not os.path.isdir(d):
            continue
        for f in sorted(os.listdir(d)):
            if not f.endswith(".mdx"):
                continue
            text = open(os.path.join(d, f), encoding="utf-8").read()
            m = re.search(r"^heroImage:\s*(.*)$", text, re.M)
            if not m:
                continue
            out.append({"col": col, "slug": f[:-4], "src": m.group(1).strip().strip("\"'")})
    return out


def ahash(data):
    im = Image.open(io.BytesIO(data)).convert("L").resize((GRID, GRID), Image.LANCZOS)
    px = list(im.getdata()) if not hasattr(im, "get_flattened_data") else list(im.get_flattened_data())
    avg = sum(px) / len(px)
    return "".join("1" if v > avg else "0" for v in px)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--collection")
    ap.add_argument("--fail", action="store_true")
    args = ap.parse_args()

    cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
    items = entries(args.collection)
    failed = []

    def fetch(e):
        if e["src"] in cache:
            e["hash"] = cache[e["src"]]
            return
        u = thumb_url(e["src"])
        if not u:
            failed.append((e["slug"], "not a Cloudinary URL"))
            return
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "MexicoInvestHeroDupeAudit/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                e["hash"] = cache[e["src"]] = ahash(r.read())
        except Exception as exc:  # noqa: BLE001
            failed.append((e["slug"], str(exc)[:60]))

    with ThreadPoolExecutor(max_workers=8) as pool:
        list(pool.map(fetch, items))
    json.dump(cache, open(CACHE, "w"))

    hashed = [e for e in items if e.get("hash")]
    seen, clusters = set(), []
    for i, a in enumerate(hashed):
        if a["slug"] in seen:
            continue
        grp = [a]
        for b in hashed[i + 1:]:
            if b["slug"] in seen:
                continue
            if sum(1 for x, y in zip(a["hash"], b["hash"]) if x != y) <= THRESHOLD:
                grp.append(b); seen.add(b["slug"])
        if len(grp) > 1:
            clusters.append(grp); seen.add(a["slug"])

    print("=== HERO DUPLICATE AUDIT ===")
    scope = f" (collection: {args.collection})" if args.collection else ""
    print(f"heroes compared: {len(hashed)}{scope}")
    print(f"repeated pictures: {len(clusters)} cluster(s), {sum(len(c) for c in clusters)} pages")
    for c in clusters:
        print("  " + "  =  ".join(f"{e['col']}/{e['slug']}" for e in c))
    if failed:
        print(f"could not fingerprint: {len(failed)}")
        for f in failed[:10]:
            print("  ! " + ": ".join(f))
    if args.fail and clusters:
        sys.exit(1)


if __name__ == "__main__":
    main()
