"""smoke_check.py
Very small, beginner-friendly checks for the static site.

Goals:
- Confirm key files exist
- Confirm index.html parses as HTML (basic)
- Confirm the logo file is a readable PNG (basic header check)

Run:
  python smoke_check.py
"""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path


SITE_ROOT = Path(__file__).resolve().parents[1]


def require(path: Path) -> None:
    if not path.exists():
        raise SystemExit(f"Missing required file: {path}")


class _Parser(HTMLParser):
    pass


def main() -> None:
    required = [
        SITE_ROOT / "index.html",
        SITE_ROOT / "projects.html",
        SITE_ROOT / "publications.html",
        SITE_ROOT / "presentations.html",
        SITE_ROOT / "css" / "global.css",
        SITE_ROOT / "css" / "layout.css",
        SITE_ROOT / "css" / "components.css",
        SITE_ROOT / "css" / "home.css",
        SITE_ROOT / "js" / "navigation.js",
        SITE_ROOT / "assets" / "logo" / "cwr_logo.png",
    ]

    for p in required:
        require(p)

    index_html = (SITE_ROOT / "index.html").read_text(encoding="utf-8")
    _Parser().feed(index_html)

    logo = (SITE_ROOT / "assets" / "logo" / "cwr_logo.png").read_bytes()
    if not logo.startswith(b"\x89PNG\r\n\x1a\n"):
        raise SystemExit("Logo file is not a valid PNG header.")

    print("Smoke check OK")
    print("- index.html characters:", len(index_html))
    print("- logo bytes:", len(logo))


if __name__ == "__main__":
    main()

