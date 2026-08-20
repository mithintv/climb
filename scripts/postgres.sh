#!/usr/bin/env bash
# Starts a local Postgres server and makes sure this app's role and database
# exist on it.
#
# The container is deliberately generic — name "postgres", the standard port,
# the superuser account — so every app on this machine shares one server. What
# belongs to climb is the role and database created inside it, not the server.
# Running this from another app's repo with its own names is the intended shape.
#
# Connection string: postgres://climb:climb@localhost:5432/climb
#
# Requires POSTGRES_PASSWORD in the repo-root .env (superuser name is "postgres").
# The climb role's password is not a secret: the database holds nothing but a
# rebuildable copy of Riot API data, and it is only reachable from this machine.
#
# The data is all rebuildable, so `docker rm -v postgres` is a supported way to
# start over — it drops every app's data on this server, not only climb's.
set -euo pipefail

CONTAINER=postgres
VOLUME=postgres-data
IMAGE=postgres:18-alpine
PORT=5432

DB_NAME=climb
DB_USER=climb
DB_PASSWORD=climb

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$root/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$root/.env"
  set +a
fi

if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "POSTGRES_PASSWORD is not set. Add it to $root/.env" >&2
  exit 1
fi

if ! docker start "$CONTAINER" 2>/dev/null; then
  # The mount is /var/lib/postgresql, not the /var/lib/postgresql/data every
  # pre-18 example uses: 18 moved the data directory into a version-named
  # subdirectory and refuses to start when the old path is mounted over.
  docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
    -p "$PORT:5432" \
    -v "$VOLUME:/var/lib/postgresql" \
    "$IMAGE"
fi

# `docker start` returns as soon as the process is up, which is before Postgres
# is accepting connections — and on a first run it is before initdb has even
# finished. Everything below is a client call, so wait for the socket.
until docker exec "$CONTAINER" pg_isready -U postgres -q; do
  sleep 1
done

psql() { docker exec -i "$CONTAINER" psql -U postgres -X -q -t -A "$@"; }

# Idempotent: this runs on every start, and CREATE ROLE/DATABASE have no
# IF NOT EXISTS, so each one is guarded by a lookup instead.
# CREATEDB is for the tests, which give each test file a database of its own —
# drizzle-kit writes `REFERENCES "public"."…"` into the generated SQL, so a
# schema per test file would not isolate them.
if [ -z "$(psql -c "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'")" ]; then
  psql -c "CREATE ROLE $DB_USER LOGIN CREATEDB PASSWORD '$DB_PASSWORD'"
  echo "Created role $DB_USER"
else
  psql -c "ALTER ROLE $DB_USER CREATEDB"
fi

if [ -z "$(psql -c "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")" ]; then
  psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER"
  echo "Created database $DB_NAME"
fi

echo "Postgres ready on port $PORT — postgres://$DB_USER@localhost:$PORT/$DB_NAME"
