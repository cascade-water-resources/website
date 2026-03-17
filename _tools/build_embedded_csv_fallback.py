"""Build a JavaScript-friendly string literal (concatenated lines) from data/content_metadata.csv.

This avoids having to manually keep content_loader.js's embedded fallback in sync.

Run:
  python _tools/build_embedded_csv_fallback.py

It prints the body you can paste into getEmbeddedCsvFallback().
"""

from __future__ import annotations

from pathlib import Path


def main() -> None:
    csv_path = Path(__file__).resolve().parents[1] / "data" / "content_metadata.csv"
    text = csv_path.read_text(encoding="utf-8").replace("\r\n", "\n").replace("\r", "\n")

    lines = [ln for ln in text.split("\n") if ln != ""]

    parts: list[str] = []
    for ln in lines:
        # Escape for inclusion in a JavaScript double-quoted string.
        s = ln.replace("\\", "\\\\").replace('"', "\\\"")

        # Each line becomes:      "...\n"  (so we can join with + )
        parts.append('      "' + s + "\\n\"")

    print("\n+\n".join(parts))


if __name__ == "__main__":
    main()
