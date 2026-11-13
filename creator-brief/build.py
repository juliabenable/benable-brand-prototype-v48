#!/usr/bin/env python3
"""Build the pages in public/ from their sources in src/.

    src/creator-brief.src.html   ->  public/creator-brief.html    (the creator-side prototype)
    src/mobile-handoff.src.html  ->  public/mobile-handoff.html   (the handoff page that goes to mobile)

Each output is ONE self-contained file: every assets/<file> reference becomes a
data URI and the Inter font is inlined, so the page works from the dev server,
from GitHub Pages, from the app's file pane and from a phone alike.

    python3 creator-brief/build.py        (run from the v48 folder, or anywhere)

Edit the src files, never the outputs.
"""
import base64
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
PAGES = ["creator-brief", "mobile-handoff"]
ASSETS = HERE / "assets"
FONT = HERE.parent / "src" / "styles" / "inter-var-latin.woff2"

MIME = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp"}


def data_uri(path: pathlib.Path) -> str:
    mime = MIME[path.suffix.lower()]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def build(name: str) -> int:
    src = HERE / "src" / f"{name}.src.html"
    out = HERE.parent / "public" / f"{name}.html"
    html = src.read_text(encoding="utf-8")  # read fully before anything is opened for writing

    missing = []
    cache = {}

    def swap(match: re.Match) -> str:
        name = match.group(1)
        path = ASSETS / name
        if not path.is_file():
            missing.append(name)
            return match.group(0)
        if name not in cache:
            cache[name] = data_uri(path)
        return f'src="{cache[name]}"'

    html = re.sub(r'src="assets/([\w.\-]+)"', swap, html)
    if missing:
        print("missing assets:", ", ".join(sorted(set(missing))), file=sys.stderr)
        return 1

    if "/*INTER*/" not in html:
        print("font marker /*INTER*/ not found in the source", file=sys.stderr)
        return 1
    font = base64.b64encode(FONT.read_bytes()).decode("ascii")
    face = (
        "@font-face { font-family: Inter; font-style: normal; font-weight: 100 900; font-display: swap; "
        f"src: url(data:font/woff2;base64,{font}) format('woff2'); }}"
    )
    html = html.replace("/*INTER*/", face, 1)

    left = re.findall(r'(?:src|href)="assets/[^"]+"|figma\.com/api', html)
    if left:
        print("unresolved references left in the output:", left[:5], file=sys.stderr)
        return 1

    out.write_text(html, encoding="utf-8")
    print(f"wrote {out.relative_to(HERE.parent)}  {len(html) / 1024:.0f} KB  ({len(cache)} assets inlined)")
    return 0


def main() -> int:
    return max(build(name) for name in PAGES)


if __name__ == "__main__":
    sys.exit(main())
