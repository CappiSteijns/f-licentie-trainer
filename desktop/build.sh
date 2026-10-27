#!/usr/bin/env bash
# Bouwt F-licentie.exe (Windows) en optioneel een Linux-variant om te testen.
#   ./build.sh            -> dist/F-licentie.exe
#   ./build.sh linux      -> dist/F-licentie-linux (zelfde programma, om hier te testen)
# Nodig: Go 1.21+ en internet (voor PocketBase). De website komt uit de rest van deze repository.
set -euo pipefail
cd "$(dirname "$0")"
PB_VERSION="${PB_VERSION:-0.25.9}"
TARGET="${1:-windows}"
case "$TARGET" in
  windows) GOOS=windows; ARCH=windows_amd64; OUT=dist/F-licentie.exe ;;
  linux)   GOOS=linux;   ARCH=linux_amd64;   OUT=dist/F-licentie-linux ;;
  *) echo "gebruik: ./build.sh [windows|linux]"; exit 1 ;;
esac
REPO="$(cd .. && pwd)"
L=launcher
rm -rf $L/site $L/assets && mkdir -p $L/site $L/assets/migrations dist
cp "$REPO/index.html" $L/site/ && cp -r "$REPO/css" "$REPO/js" "$REPO/data" "$REPO/img" $L/site/
cp "$REPO"/pocketbase/pb_migrations/*.js $L/assets/migrations/
CACHE=".cache"; mkdir -p $CACHE
ZIP="$CACHE/pocketbase_${PB_VERSION}_${ARCH}.zip"
[ -f "$ZIP" ] || curl -fsSL -o "$ZIP" "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_${ARCH}.zip"
cp "$ZIP" $L/assets/pocketbase.zip
(cd $L && GOOS=$GOOS GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags "-s -w" -o "../$OUT" .)
rm -rf $L/site $L/assets
ls -la "$OUT"
