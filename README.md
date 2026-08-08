# Climb

A League of Legends match-tracking app with a React front end and an Express/MongoDB API.

## Structure

This is a pnpm workspace with two packages:

- `backend/` — Express server (port 3080) backed by SQLite
- `frontend/` — React app (Vite + Tailwind, port 5173)

## Prerequisites

- Node.js 24+ (the backend uses the built-in `node:sqlite` module) and [pnpm](https://pnpm.io/)
- A Riot Games API key for match/summoner lookups

The database is a SQLite file at `backend/climb.db`, created automatically on first run.

## Running locally

Install all dependencies from the root:

```sh
pnpm install
```

Then start both apps:

```sh
pnpm start
```

Or start them individually:

```sh
pnpm start:backend    # http://localhost:3080
pnpm start:frontend   # http://localhost:5173
```

The frontend expects the backend at http://localhost:3080.

## Configuration

Backend environment variables (loaded via dotenv — put them in `backend/.env`):

- `X_RIOT_TOKEN` — Riot Games API key, used when fetching match data
- `PORT` — backend port override (defaults to 3080)

Frontend:

- `frontend/.env` — optional `VITE_BACKEND_URL` (backend base URL, defaults to `http://localhost:3080`)
- `frontend/src/config/config.js` — `summonerName` (fallback summoner used when the search box is empty)
