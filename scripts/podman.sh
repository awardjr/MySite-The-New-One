#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

IMAGE="mysite:local"
APP="mysite-local"
PORT="${PORT:-3000}"

build() {
	podman build --format docker -f Containerfile -t "$IMAGE" .
}

case "${1:-}" in
	build)
		build
		;;

	up)
		podman image exists "$IMAGE" || build
		podman rm -f "$APP" >/dev/null 2>&1 || true
		podman run -d --name "$APP" \
			-p "127.0.0.1:$PORT:3000" \
			-e "ORIGIN=http://localhost:$PORT" \
			-e BODY_SIZE_LIMIT=10M \
			-v mysite-local-data:/app/data \
			-v mysite-local-uploads:/app/uploads \
			"$IMAGE" >/dev/null
		for _ in $(seq 1 60); do
			if curl -s -o /dev/null "http://localhost:$PORT/"; then
				echo "Running at http://localhost:$PORT (admin: /admin)"
				exit 0
			fi
			sleep 0.5
		done
		echo "Timed out waiting for the site (check: npm run podman:logs)" >&2
		exit 1
		;;

	down)
		podman rm -f "$APP" >/dev/null 2>&1 || true
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
