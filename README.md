# Climb

A League of Legends match-tracking app with a React front end and a NestJS API.

## Structure

This is a pnpm workspace with two packages:

- `backend/` — NestJS server (port 3080) backed by Postgres
- `frontend/` — React app (Vite + Tailwind, port 5173)

The backend splits three ways:

- `src/features/` — what the API exposes. `accounts/` and `matches/`, each a module owning its
  controller (request handling), service (policy) and repository (SQL).
- `src/integrations/` — third-party APIs we consume. `riot/` has no routes of its own; features
  inject it.
- `src/core/` — what everything shares and nothing owns: the database, the outbound HTTP client and
  the logger. Only `src/core/database/` touches the database handle directly; everything else
  injects a repository.

## Prerequisites

- Node.js 24+ and [pnpm](https://pnpm.io/)
- Docker, for the Postgres the backend saves Riot data into
- A Riot Games API key for match/summoner lookups

Start Postgres and provision this app's role and database:

```sh
scripts/postgres.sh    # needs POSTGRES_PASSWORD in the repo-root .env
```

The container is deliberately generic — name `postgres`, the standard port, the superuser account —
so one server is shared across apps on the machine; what belongs to climb is the `climb` role and
database created inside it. The connection string goes in `backend/.env` as `DATABASE_URL`; see
`backend/.env.example`. Nothing in the database is authored — every row came from the Riot API — so
dropping it is always safe.

One table per file under `src/core/database/models/`, and migrations are generated from them, never
hand-written:

```sh
pnpm --filter backend db:generate   # models/*.model.ts -> src/core/database/migrations/*.sql
```

`drizzle-kit` takes a glob, so adding a table is adding a file. It diffs the models against the
snapshot in `migrations/meta/` and writes the SQL; the app applies anything outstanding at boot and
records it in Drizzle's own `drizzle.__drizzle_migrations` table. Edit a model, run the command,
commit both. The build copies the folder into `dist/` because tsc emits no `.sql`.

The one place that has to list the tables by hand is `createDrizzle`, which assembles them into the
single object drizzle wants. A `models/index.ts` re-exporting them would be a barrel, so the binding
lives in the module that was already doing it. A table left out of that object still works with
`db.select()` and silently vanishes from `db.query`.

Queries go through **Drizzle**, over `node-postgres`. `src/core/database/drizzle.ts` binds the schema
to a pool and exports the `Drizzle` type every repository is written against. Four things about the
setup are not obvious:

- **Row types are inferred from the models**, one per table under `src/core/database/types/`, via
  `$inferSelect`. Those are the same files the migrations are generated from, so there is one source
  of truth and a test that fails if a model declares a column the migrations never created.
- **`drizzle-kit` brings esbuild in**, which ships install scripts. It works anyway because
  `pnpm-workspace.yaml` denies that script rather than blocking on it — esbuild ships prebuilt
  binaries, so nothing needs to run at install time (see AGENTS.md).
- **`bytea` is a custom type.** Drizzle 0.45 has no builtin for it, so
  `src/core/database/bytea.ts` declares one; node-postgres already reads and writes `Buffer`, so it
  only has to name the SQL type.
- **Tests get a database each, not a schema each.** `drizzle-kit` writes
  `REFERENCES "public"."matches"` into the generated SQL, so tables created in another schema would
  have their foreign keys pointing back at `public`. `createTestDatabase` creates and drops a real
  database per test file, which is why `scripts/postgres.sh` grants the role `CREATEDB`.

### Saved match payloads

`GET /matches/:matchId` saves what it fetches. The first request for a match stores it; every later
one reads it back out of Postgres and never asks Riot again.

It is deliberately not a cache — nothing expires, is evicted or is revalidated. A completed match is
immutable, so the saved row is the record rather than a copy of one that could go stale. (Accounts
are a cache, with a 24-hour TTL, because a riot id released by a rename can be claimed by someone
else.)

- **The response body is saved whole and byte-exact**, gzipped into `matches.payload` (85 KB → 11.8
  KB measured). Not `jsonb`, which normalises key order and drops duplicate keys and so cannot
  return the bytes Riot sent — and byte-exactness is what makes a field Riot adds next patch safe to
  save today. That is also why the fetch goes through `HttpClientService.getText`, unparsed.
- **The columns beside it are a projection**, only of what a match card renders. They are all
  nullable and the extractors never throw: measured over 16 real payloads, participants carry 156
  distinct keys and the set is not stable between patches, so a projection that could fail would
  turn a Riot patch into a failed ingest. Everything is recomputable from the blob, which is why
  there is no `match_teams` table yet and why adding a column is a re-projection rather than a
  re-fetch.
- **`matches` has no puuid dimension.** Fetching one match on behalf of four different participants
  returns four byte-identical bodies, so the ten players in a game share one row.

## Running locally

Install all dependencies from the root:

```sh
pnpm install
```

Then start both apps:

```sh
pnpm dev
```

Or start them individually:

```sh
pnpm dev:backend    # http://localhost:3080
pnpm dev:frontend   # http://localhost:5173
```

The frontend expects the backend at http://localhost:3080.

## Backend build

The backend compiles with plain `tsc`, not the Nest CLI. The CLI calls TypeScript's programmatic
compiler API, which 7.0 does not ship (it is expected back in 7.1), and nothing at runtime needs
it — `@nestjs/core` boots whatever JS `tsc` emits. What that costs is `nest g resource`
scaffolding. If that starts to hurt, pin the backend to `typescript@^6` and reinstate
`@nestjs/cli`; the pin is per-package, so the frontend can stay on 7.

```sh
pnpm --filter backend build      # tsc -p tsconfig.build.json -> dist/
pnpm --filter backend start      # node dist/main.js
pnpm --filter backend test       # vitest
pnpm --filter backend typecheck
```

`pnpm --filter backend dev` runs `tsc -w` and `node --watch dist/main.js` in parallel — the Nest
CLI's watch mode without the CLI.

Four settings are load-bearing and not obvious from the files themselves:

- **The backend is ESM.** `pino-seq` publishes an `import`-only export map, so a CommonJS build
  cannot `require()` it at all. `rewriteRelativeImportExtensions` is what lets imports keep the
  repo's `./thing.ts` style while emitting `./thing.js`.
- **Two tsconfigs**, because the project checks more than it emits. `tsconfig.json` covers all of
  `src` so the editor and `pnpm typecheck` see errors in tests; `tsconfig.build.json` excludes
  `**/*.test.ts` so they never reach `dist/`.
- **`emitDecoratorMetadata`** is what Nest's DI reads to resolve constructor parameters. Verified
  working on TypeScript 7.0.2.
- **Biome needs two opt-ins.** `unsafeParameterDecoratorsEnabled` to parse `@Param`/`@Inject` at
  all — an unparsed file is silently neither linted nor formatted — and `useImportType` is off for
  `backend/src`, because it rewrites an injectable's import to `import type` and erases the very
  class the DI container needs at runtime.
- **Tests resolve through Nest's container** via `Test.createTestingModule`, which needs
  `design:paramtypes` — so `backend/vitest.config.ts` swaps vitest's esbuild for a swc transformer,
  which emits it. That matters because the `useImportType` hazard above breaks DI at runtime while
  leaving a `new`-constructed test passing; going through the container turns it into a test
  failure. `@swc/core` ships an install script, so `pnpm-workspace.yaml` denies it — it works from
  its prebuilt binaries, verified emitting the metadata with the script never run.

## Riot static assets

Two CDNs, neither official-with-a-contract, both public and unauthenticated.

### Data Dragon

`https://ddragon.leagueoflegends.com/cdn/<version>/data/en_US/<file>.json` — `champion`,
`item`, `runesReforged`, `summoner`. Images live at `/cdn/<version>/img/{item,champion,spell}/…`;
rune icons are the one unversioned path, `/cdn/img/perk-images/…`.

- **Every patch stays addressable.** `versions.json` lists ~496 of them, verified live back to
  5.1.1; only the `lolpatch_3.x` tail 404s. Backfilling history is a URL swap, not a data-recovery
  problem, so anything that stores this data should be patch-scoped from the start.
- **`/cdn/<version>/img/ui/*` does not exist** — every path under it 403s. Data Dragon serves no
  stat, tag, or shop-chrome icons at all.
- **Descriptions are pre-stripped.** `item.json`'s `description` is the game's tooltip with the
  spell-sourced numbers removed: Hextech Rocketbelt reads "deal magic damage" with no value and no
  cooldown, and 11 items render a literal blank where a number belongs. It is byte-for-byte the
  game's `…_externaldescription` string (see below). Cooldowns and damage ratios are not in this
  file under any key.
- **`maps` means "enabled here", not "in this shop".** Map 11 pulls in items only reachable on the
  Rift through another queue. Requiring `maps["11"] && maps["453"]` (Classic Rift) separates them —
  see `frontend/src/lib/items.ts`.
- **Six-digit ids are alternate-mode copies** (Arena, Swarm) that duplicate Rift items and still
  flag `maps["11"]`. On non-Rift maps they are the real items, so that filter is Rift-specific.

### CommunityDragon

`https://raw.communitydragon.org/latest/…` mirrors the client and game files. Append `/json/` after
the host for a machine-readable directory listing — `https://raw.communitydragon.org/json/latest/<path>/`
returns `[{name, type, mtime}]`. The HTML listing is rendered client-side and cannot be scraped.

Paths worth knowing:

| Path (under `raw.communitydragon.org/latest/`) | What's there |
| --- | --- |
| `plugins/rcp-be-lol-game-data/global/default/v1/items.json` | Item data. No `maps` field, so it cannot answer "which shop" — and it ships the same stripped description as Data Dragon. |
| `plugins/rcp-be-lol-game-data/global/default/v1/maps.json` | Authoritative map names: 11 Summoner's Rift, 12 Random Map (ARAM), 21 Nexus Blitz, 22 TFT, 30 Arena, 33 Swarm, 35 The Bandlewood, 453 Classic Rift. |
| `game/assets/ux/itemshop/itemshop_texture_atlas4.png` | The shop's stat-rail icons — a 14×5 sprite grid (14 stats, 5 colour variants) packed **without a manifest**. Sliced into `frontend/src/assets/icons/item-tags/` by measuring opaque bands off the alpha channel; the grid pitch is irregular (25–30px), so it is not derivable from a cell size. |
| `game/en_us/data/menu/en_us/lol.stringtable.json` | 33MB, ~139k localized strings. `generatedtip_item_<id>_description` is the **unstripped** tooltip, with `@Placeholder@` tokens and `{{ Sub_Template }}` references (`item_cooldown` = `%i:cooldown% (@Cooldown@s)`). |
| `game/items.cdtb.bin.json` | 16MB item bin: per-item `mDataValues`, `mItemCalculations` (typed formula trees), stat mods, and `Items/<id>/Spells/<id>Active.mSpell.cooldownTime`. |

The in-game shop's own UI art is atlas-packed with no coordinate manifest, and the atlas repacks
between patches — hotlinking it and slicing at runtime would break silently, which is why the icons
are committed as files.

Reconstructing full tooltips (cooldowns, damage ratios) means joining the string table to the item
bin and evaluating the formula trees; see the follow-up ticket. All 206 Rift items have both a
template and a bin entry, and 160 resolve every placeholder from bin + Data Dragon `stats`/`effect`.

## Configuration

Backend environment variables (loaded via dotenv — put them in `backend/.env`):

- `X_RIOT_TOKEN` — Riot Games API key, used when fetching match data
- `DATABASE_URL` — Postgres connection string; required, and the repository tests read it too
- `PORT` — backend port override (defaults to 3080)

Repo root (`.env`, consumed by the container scripts):

- `POSTGRES_PASSWORD` — the local Postgres superuser's password, used to create the `climb` role
- `SEQ_ADMIN_PASSWORD` — the local Seq container's `admin` password

Frontend:

- `frontend/.env` — optional `VITE_BACKEND_URL` (backend base URL, defaults to `http://localhost:3080`)
- `frontend/src/config/config.js` — `summonerName` (fallback summoner used when the search box is empty)
