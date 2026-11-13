#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# Runs the production image locally behind Caddy, the same way it is deployed: Caddy terminates
# TLS (with a certificate from its own local CA) and proxies to the app over plain http.
IMAGE="${IMAGE:-mysite:local}"
APP="${APP:-mysite-local}"
PORT="${PORT:-3000}"
POD="$APP-pod"
PROXY="$APP-caddy"
CADDY_IMAGE="docker.io/library/caddy:2"
URL="https://localhost:$PORT"

build() {
	podman build --format docker -f Containerfile -t "$IMAGE" .
}

down() {
	podman pod rm -f "$POD" >/dev/null 2>&1 || true
	# A container left over from before the pod existed.
	podman rm -f "$APP" >/dev/null 2>&1 || true
}

case "${1:-}" in
	build)
		build
		;;

	up)
		podman image exists "$IMAGE" || build
		down
		# Containers in a pod share localhost, so Caddy reaches the app on 127.0.0.1:3000.
		podman pod create --name "$POD" -p "127.0.0.1:$PORT:$PORT" >/dev/null
		podman run -d --pod "$POD" --name "$APP" \
			-e "ORIGIN=$URL" \
			-e ADDRESS_HEADER=X-Forwarded-For \
			-e XFF_DEPTH=1 \
			-e BODY_SIZE_LIMIT=10M \
			-v "$APP-data:/app/data" \
			-v "$APP-uploads:/app/uploads" \
			"$IMAGE" >/dev/null
		# The volume keeps Caddy's local CA, so the certificate stays the same between runs.
		# --disable-redirects: no http->https listener on port 80, which a rootless pod can't bind.
		podman run -d --pod "$POD" --name "$PROXY" \
			-v "$APP-caddy:/data" \
			"$CADDY_IMAGE" \
			caddy reverse-proxy --from "$URL" --to 127.0.0.1:3000 --disable-redirects >/dev/null
		for _ in $(seq 1 60); do
			# -k: the certificate is signed by Caddy's local CA, which curl doesn't know.
			if curl -sk -o /dev/null "$URL/"; then
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
