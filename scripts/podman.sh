#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE="${IMAGE:-mysite:local}"
APP="${APP:-mysite-local}"
PORT="${PORT:-3000}"
APP_PORT="$((PORT + 1))"
POD="$APP-pod"
PROXY="$APP-caddy"
CADDY_IMAGE="docker.io/library/caddy:2"
URL="https://localhost:$PORT"
SECRET_FILE=".certs/podman-auth-secret"

build() {
	podman build --format docker -f Containerfile -t "$IMAGE" .
}

down() {
	podman pod rm -f "$POD" >/dev/null 2>&1 || true
}

case "${1:-}" in
	build)
		build
		;;

	up)
		podman image exists "$IMAGE" || build
		if [ ! -s "$SECRET_FILE" ]; then
			mkdir -p "$(dirname "$SECRET_FILE")"
			(umask 077 && openssl rand -base64 32 >"$SECRET_FILE")
		fi
		down
		podman pod create --name "$POD" -p "127.0.0.1:$PORT:$PORT" >/dev/null
		podman run -d --pod "$POD" --name "$APP" \
			-e "PORT=$APP_PORT" \
			-e "ORIGIN=$URL" \
			-e "BETTER_AUTH_SECRET=$(cat "$SECRET_FILE")" \
			-e ADDRESS_HEADER=X-Forwarded-For \
			-e XFF_DEPTH=1 \
			-e BODY_SIZE_LIMIT=10M \
			-v "$APP-data:/app/data" \
			-v "$APP-uploads:/app/uploads" \
			"$IMAGE" >/dev/null
		podman run -d --pod "$POD" --name "$PROXY" \
			-v "$APP-caddy:/data" \
			"$CADDY_IMAGE" \
			caddy reverse-proxy --from "$URL" --to "127.0.0.1:$APP_PORT" --disable-redirects >/dev/null
		for _ in $(seq 1 60); do
			if curl -fsk -o /dev/null "$URL/"; then
				echo "Running at $URL (admin: /admin)"
				echo "Your browser will warn about the certificate once: it is signed by Caddy's local CA."
				exit 0
			fi
			sleep 0.5
		done
		echo "Timed out waiting for the site (check: npm run podman:logs)" >&2
		exit 1
		;;

	down)
		down
		echo "Stopped $APP"
		;;

	logs)
		podman logs -f "$APP"
		;;

	*)
		echo "Usage: $0 {build|up|down|logs}" >&2
		exit 1
		;;
esac
