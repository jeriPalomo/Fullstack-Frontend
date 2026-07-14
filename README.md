# Simple Bank Application

A Spring Boot REST API for looking up bank customers, backed by MongoDB.

**Endpoints:**
- `GET /api/customers` — list all customers
- `GET /api/customers/{customerId}` — get one customer

**Run it:**

1. Start MongoDB:
   ```
   cd customer-api
   powershell -ExecutionPolicy Bypass -File start-mongo.ps1
   ```
2. In a second terminal, start the app:
   ```
   cd customer-api
   ./mvnw spring-boot:run
   ```
3. Open [http://localhost:8080/api/customers](http://localhost:8080/api/customers)

Three demo customers are seeded automatically on first run.
