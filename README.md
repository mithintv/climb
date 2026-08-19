# Climb

A League of Legends match-tracking app with a React front end and a NestJS API.

## Structure

This is a pnpm workspace with two packages:

- `backend/` — NestJS server (port 3080) backed by SQLite
- `frontend/` — React app (Vite + Tailwind, port 5173)

The backend is laid out by feature, as Nest expects. `src/accounts/`, `src/matches/` and
`src/riot/` each hold one module, and a module owns its controller (request handling), its service
(policy) and its repository (SQL). Only `src/database/` touches the database handle directly;
everything else injects a repository.

## Prerequisites

- Node.js 24+ (the backend uses the built-in `node:sqlite` module) and [pnpm](https://pnpm.io/)
- A Riot Games API key for match/summoner lookups

The database is a SQLite file at `backend/climb.db`, created and migrated on first run. It holds
nothing that cannot be re-fetched, so deleting it is always safe.

Migrations are generated from the schema, never hand-written:

```sh
pnpm --filter backend db:generate   # schema.ts -> src/database/migrations/*.sql
```

`drizzle-kit` diffs `src/database/schema.ts` against the snapshot in `migrations/meta/` and writes
the SQL; the app applies anything outstanding at boot and records it in Drizzle's own
`__drizzle_migrations` table. Edit the schema, run the command, commit both. The build copies the
folder into `dist/` because tsc emits no `.sql`.

Queries go through **Drizzle**, over the builtin `node:sqlite` driver rather than a native one.
Drizzle ships no `node:sqlite` driver, so `src/database/drizzle.ts` wires its `sqlite-proxy`
dialect to a `DatabaseSync` handle — the proxy is just "give me a function that runs SQL", which is
what `DatabaseSync` is. Four things there are not obvious:

- **Row types come from `src/database/schema.ts`**, via `$inferSelect` — the same file the
  migrations are generated from, so there is one source of truth and a test that fails if the
  schema declares a column the migrations never created.
- **`drizzle-kit` brings esbuild in**, which ships install scripts. It works anyway because
  `pnpm-workspace.yaml` denies that script rather than blocking on it — esbuild ships prebuilt
  binaries, so nothing needs to run at install time (see AGENTS.md).
- **Rows must be returned positionally**, not as objects — `statement.setReturnArrays(true)`, which
  Node 24 supports natively. On a `get` miss the driver passes `undefined` through rather than an
  empty array, because Drizzle decides "no result" by truthiness and `[]` is truthy.
- **Transactions are serialised by a lock.** The driver is async over a synchronous,
  single-connection database, so without it a second `BEGIN` lands inside the first transaction and
  SQLite fails with "cannot start a transaction within a transaction". There is a test that fails
  when the lock is removed.

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
- **Tests construct their subjects with `new`,** not `Test.createTestingModule`. Resolving by type
  needs `design:paramtypes`, which vitest's esbuild cannot emit; the alternative was a swc
  transformer, and that pulls a package with a native postinstall script into the tree. The DI
  wiring is covered by the app booting instead.

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
| `game/assets/ux/itemshop/itemshop_texture_atlas4.png` | The shop's stat-rail icons — a 14×5 sprite grid (14 stats, 5 colour variants) packed **without a manifest**. Sliced into `frontend/src/assets/item-tags/` by measuring opaque bands off the alpha channel; the grid pitch is irregular (25–30px), so it is not derivable from a cell size. |
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
- `PORT` — backend port override (defaults to 3080)

Frontend:

- `frontend/.env` — optional `VITE_BACKEND_URL` (backend base URL, defaults to `http://localhost:3080`)
- `frontend/src/config/config.js` — `summonerName` (fallback summoner used when the search box is empty)
