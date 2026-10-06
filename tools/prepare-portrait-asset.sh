#!/bin/bash
# ============================================================
# prepare-portrait-asset.sh — M3 tool (plan §5.2)
# Rebuilds assets/portrait.png from the original photo, one reproducible chain:
#   crop (subject, right ~55%) → 640px → tone bake (gamma 1.25, desat 0.8)
#   → dodge (face lift +0.10 r200 @(300,300); plants-left +0.12; plants-right +0.10)
#   → 128-color palette, no dither.
# The baked asset is the single source for BOTH js/portrait.js (canvas)
# and tools/generate-portrait-fallback.js (SVG) — no drift possible.
# Requires: ffmpeg.  Run from repo root:  bash tools/prepare-portrait-asset.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="plans/initial/assets/portrait.png"
OUT="assets/portrait.png"
PAL="tools/.palette.tmp.png"

# dodge lift as a function of X,Y (image space 640×799) — same expression for R,G,B
DODGE="0.10*pow(clip(1-hypot(X-300,Y-300)/200,0,1),2)+0.12*clip(1-X/280,0,1)*clip(1-abs(Y-500)/350,0,1)+0.10*clip(1-(640-X)/160,0,1)*clip(1-abs(Y-350)/250,0,1)"
PREP="crop=820:1024:660:0,scale=640:-1:flags=lanczos,eq=gamma=1.25:saturation=0.8,format=gbrp"
BAKE="geq=r='clip(r(X,Y)+255*(${DODGE}),0,255)':g='clip(g(X,Y)+255*(${DODGE}),0,255)':b='clip(b(X,Y)+255*(${DODGE}),0,255)',format=rgb24"

# pass 1: palette from the fully processed stream
ffmpeg -y -loglevel error -i "$SRC" -filter_complex "${PREP},${BAKE},palettegen=max_colors=128" "$PAL"
# pass 2: same processing + palette apply (no dither — the halftone sampler wants clean tones)
ffmpeg -y -loglevel error -i "$SRC" -i "$PAL" -filter_complex "[0:v]${PREP},${BAKE}[p];[p][1:v]paletteuse=dither=none" -map_metadata -1 "$OUT"
rm -f "$PAL"

echo "wrote $OUT ($(stat -f%z "$OUT") bytes)"
