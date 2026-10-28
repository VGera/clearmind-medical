#!/usr/bin/env bash
# Build this prototype and ship it to the host that serves vijeta.me.
#
#   REMOTE_HOST=<host> bash deploy/ship-clearmind.sh
#
# The base path is baked in at build time, because Next writes its asset URLs
# during the build — it cannot be switched at runtime. The image is built here
# and transferred, so the portfolio's own deploy never has to build it.
#
# After this, apply the routing from the portfolio repo:
#   cd ~/portfolio && bash deploy/redeploy.sh --no-build
set -euo pipefail

# Set these for your own host; no default, so the script cannot quietly
# target someone else's machine.
REMOTE_HOST="${REMOTE_HOST:?set REMOTE_HOST to the host that serves the site}"
REMOTE_USER="${REMOTE_USER:-$USER}"
BASE_PATH="${BASE_PATH:-/ClearMind}"
IMAGE="clearmind-medical:latest"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { printf '\e[1;36m▸\e[0m %s\n' "$*"; }
ok()  { printf '\e[1;32m✓\e[0m %s\n' "$*"; }

cd "$REPO_ROOT"

log "Building $IMAGE with basePath=$BASE_PATH"
docker build --build-arg "NEXT_BASE_PATH=$BASE_PATH" -t "$IMAGE" .
ok "built"

log "Checking it serves $BASE_PATH before shipping it"
cid="$(docker run -d -P "$IMAGE")"
trap 'docker rm -f "$cid" >/dev/null 2>&1 || true' EXIT
port="$(docker port "$cid" 3001/tcp | head -1 | sed 's/.*://')"
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${port}${BASE_PATH}" || true)"
  [[ "$code" == "200" ]] && break
  sleep 1
done
[[ "$code" == "200" ]] || { echo "smoke test failed: $BASE_PATH returned $code" >&2; exit 1; }
curl -s "http://127.0.0.1:${port}${BASE_PATH}" | grep -q "${BASE_PATH}/_next/static" \
  || { echo "asset URLs are missing the base path" >&2; exit 1; }
ok "serves $BASE_PATH with prefixed assets"
docker rm -f "$cid" >/dev/null
trap - EXIT

log "Transferring to ${REMOTE_USER}@${REMOTE_HOST}"
docker save "$IMAGE" | gzip -1 | ssh "${REMOTE_USER}@${REMOTE_HOST}" 'gunzip | docker load'
ok "image loaded on the remote"

echo
echo "Next: cd ~/portfolio && bash deploy/redeploy.sh --no-build"
