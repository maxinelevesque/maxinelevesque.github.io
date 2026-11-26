#!/usr/bin/env python3
"""Subset the fallback fonts for symbols the site's fonts lack (SPEC.md "Site-wide", Glyphs).

EB Garamond and IBM Plex Mono have no arrows, set brackets, geometric shapes or subscript digits,
and Plex Mono has no Greek. These faces stand in for exactly those characters, and the browser
fetches one only when a page uses a character in its range:

  Fallback Serif Math  STIX Two Math, behind EB Garamond (and last behind Plex Mono)
  Fallback Mono Greek  Noto Sans Mono's Greek, behind IBM Plex Mono
  Fallback Sans Math   Noto Sans Math, behind IBM Plex Mono

All three are SIL Open Font License 1.1; the licences sit beside the files. Sources are the
@fontsource packages (devDependencies). Needs fontTools:  python3 scripts/subset-fallback-fonts.py
The ranges here must match the @font-face rules in src/styles/global.css.
"""
import os
import shutil
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "node_modules", "@fontsource")
OUT = os.path.join(ROOT, "public", "fonts", "fallback")
SYMBOLS = "U+2080-209C,U+2150-218F,U+2190-21FF,U+2200-22FF,U+25A0-25FF,U+27E6-27EF"
FACES = [
    ("serif-math", "stix-two-math", "stix-two-math-latin-400-normal.woff", SYMBOLS),
    ("mono-greek", "noto-sans-mono", "noto-sans-mono-greek-400-normal.woff", "U+0370-03FF"),
    ("sans-math", "noto-sans-math", "noto-sans-math-latin-400-normal.woff", SYMBOLS),
]

os.makedirs(OUT, exist_ok=True)
for name, pkg, file, ranges in FACES:
    unicodes = []
    for part in ranges.split(","):
        a, _, b = part[2:].partition("-")
        unicodes += range(int(a, 16), int(b or a, 16) + 1)
    options = subset.Options()
    options.flavor = "woff"  # zlib; WOFF2 would need brotli here, and every browser reads WOFF
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    font = subset.load_font(os.path.join(SRC, pkg, "files", file), options)
    s = subset.Subsetter(options)
    s.populate(unicodes=unicodes)
    s.subset(font)
    dest = os.path.join(OUT, f"{name}.woff")
    subset.save_font(font, dest, options)
    shutil.copy(os.path.join(SRC, pkg, "LICENSE"), os.path.join(OUT, f"{name}.LICENSE.txt"))
    print(f"{dest}: {os.path.getsize(dest) // 1024} KB, {len(font.getBestCmap())} characters")
