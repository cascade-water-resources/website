"""write_logo_png.py
Creates a tiny valid PNG at assets/logo/cwr_logo.png.

Why:
- Phase 1 needs a logo file path that doesn't break in browsers.
- We don't have final branding yet, so this is a simple placeholder image.

Run:
  python write_logo_png.py
"""

from __future__ import annotations

import base64
from pathlib import Path


def main() -> None:
    # 32x32 PNG placeholder (simple solid block).
    png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAP0lEQVRYR+3OMQ0AIADAMMC/"
        "5yFjRxMF8kE5M7sQb2wJAAAAAAAAAAAAAAAAAAAAAAAAgK8C2F0AAZK8I1wAAAAASUVORK5CYII="
    )

    site_root = Path(__file__).resolve().parents[1]
    logo_path = site_root / "assets" / "logo" / "cwr_logo.png"
    logo_path.parent.mkdir(parents=True, exist_ok=True)

    logo_path.write_bytes(base64.b64decode(png_b64))
    print(f"Wrote {logo_path} ({logo_path.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

