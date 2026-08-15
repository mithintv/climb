#!/usr/bin/env bash
# Starts a local Seq log server.
# UI + ingestion: http://localhost:5341
# (host 5341 maps to the container's port 80, which serves both)
#
# Requires SEQ_ADMIN_PASSWORD in the repo-root .env (admin username is "admin").
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$root/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$root/.env"
  set +a
fi

if [ -z "${SEQ_ADMIN_PASSWORD:-}" ]; then
  echo "SEQ_ADMIN_PASSWORD is not set. Add it to $root/.env" >&2
  exit 1
fi

docker start seq 2>/dev/null && exit 0

docker run -d \
  --name seq \
  --restart unless-stopped \
  -e ACCEPT_EULA=Y \
  -e SEQ_PASSWORD="$SEQ_ADMIN_PASSWORD" \
  -p 5341:80 \
  -v seq-data:/data \
  datalust/seq
