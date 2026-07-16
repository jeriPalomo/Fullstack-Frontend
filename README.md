# Full Stack Banking App

A full-stack customer/account banking app: React frontend, Spring Boot REST API, MongoDB database.

Stack: `React (Vite)` → `Spring Boot REST API` → `Spring Data MongoDB` → `MongoDB`

## Prerequisites

- Java 21
- Node.js
- MongoDB Server (installed at `C:\Program Files\MongoDB\Server\8.3\`)

## Starting the app

```powershell
npm install   # first time only - installs the dev-orchestration tooling (concurrently, wait-on)
npm run dev
```

This starts MongoDB, the backend API, and the frontend together in one terminal, in order (Mongo → backend, once Mongo is accepting connections → frontend, once the backend is serving), with labeled/colored output per service. Ctrl+C stops all three.

If Ctrl+C ever leaves a process behind (can happen with nested process trees on Windows), run:

```powershell
npm run stop   # force-kills whatever is listening on 27018/8080/5173
```

The project runs its own local `mongod` on port `27018` (not MongoDB's default `27017`) storing data in `customer-api/mongo-data` - this avoids colliding with a system-wide MongoDB service if one happens to already be running on this machine. The frontend also still needs its own dependencies installed once: `npm --prefix frontend install`.

### Running services individually

Useful for debugging one service in isolation. Each can also be run directly, each in its own terminal:

```powershell
npm run mongo      # mongod on port 27018, data in customer-api/mongo-data
npm run backend     # Spring Boot API on http://localhost:8080
npm run frontend    # Vite dev server, by default on http://localhost:5173
```

## Verifying it's running

- MongoDB: `netstat -an | findstr 27018` should show a `LISTENING` line.
- Backend: `netstat -an | findstr 8080` should show a `LISTENING` line, or visit `http://localhost:8080` in a browser.
- Frontend: open the URL printed by `npm run dev` in a browser.

## Logging in

Auth is JWT-based: `POST /api/auth/login` returns a bearer token, which the frontend stores and attaches to every subsequent API request. Everything under `/api/**` except `/api/auth/**` requires a valid token, and endpoints are further restricted by role (admin-only) or resource ownership (a customer can only act on their own accounts, unless they're an admin).

Demo accounts (seeded automatically on first run against an empty database):

| Username | Password | Role |
|---|---|---|
| `sonia.jain` | `pass123` | customer |
| `nevil.johnson` | `pass123` | customer |
| `carla.gomez` | `pass123` | customer |
| `priya.admin` | `admin123` | admin |

## Browsing the database

Install the MongoDB VSCode extension and connect to `mongodb://localhost:27018`, database `customerapi`, to browse collections visually.
