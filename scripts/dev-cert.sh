#!/usr/bin/env bash
# Creates a self-signed certificate for the dev server (https://localhost:5173) if there isn't
# one yet. vite.config.ts serves over https whenever these files exist.
set -euo pipefail

cd "$(dirname "$0")/.."

DIR=".certs"
KEY="$DIR/localhost-key.pem"
CERT="$DIR/localhost.pem"

if [ -f "$KEY" ] && [ -f "$CERT" ]; then
	exit 0
fi

if ! command -v openssl >/dev/null 2>&1; then
	echo "openssl not found: the dev server will use plain http." >&2
	exit 0
fi

mkdir -p "$DIR"
openssl req -x509 -newkey ec -pkeyopt ec_paramgen_curve:prime256v1 -nodes \
	-keyout "$KEY" -out "$CERT" -days 825 \
	-subj "/CN=localhost" \
	-addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:::1" >/dev/null 2>&1
chmod 600 "$KEY"
echo "Created a self-signed certificate in $DIR/ (your browser will warn about it once)."
