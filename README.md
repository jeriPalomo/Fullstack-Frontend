# Full Stack Banking App

A full-stack customer/account banking app: React frontend, Spring Boot REST API, MongoDB database.

Stack: `React (Vite)` → `Spring Boot REST API` → `Spring Data MongoDB` → `MongoDB`

## Prerequisites

- Java 21
- Node.js
- MongoDB Server (installed at `C:\Program Files\MongoDB\Server\8.3\`)

## Starting the app

Start these in order, each in its own terminal.

### 1. MongoDB

```powershell
cd customer-api
./start-mongo.ps1
```

Starts `mongod` on port `27017`, storing data in `customer-api/mongo-data`.

### 2. Backend API

```powershell
cd customer-api
./mvnw.cmd spring-boot:run
```

Starts the Spring Boot API on `http://localhost:8080`, connecting to the `customerapi` database in MongoDB (see `src/main/resources/application.properties`).

### 3. Frontend

```powershell
cd frontend
npm install   # first time only
npm run dev
```

Starts the Vite dev server, by default on `http://localhost:5173` (or the next free port if that's taken).

## Verifying it's running

- MongoDB: `netstat -an | findstr 27017` should show a `LISTENING` line.
- Backend: `netstat -an | findstr 8080` should show a `LISTENING` line, or visit `http://localhost:8080` in a browser.
- Frontend: open the URL printed by `npm run dev` in a browser.

## Browsing the database

Install the MongoDB VSCode extension and connect to `mongodb://localhost:27017`, database `customerapi`, to browse collections visually.
