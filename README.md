# Clinic FHIR System

A production-style, FHIR-compliant clinical management system for a small clinic. Built for learning and portfolio purposes using Java 21, Spring Boot, HAPI FHIR, and Angular.

## Architecture

```
Client (Postman / Angular)
        ↓  REST JSON
clinic-api  (Spring Boot — business logic, DTO↔FHIR mapping)
        ↓  FHIR REST (HTTP/JSON)
HAPI FHIR JPA Server  (FHIR resource storage + validation)
        ↓  JPA/JDBC
PostgreSQL  (managed entirely by HAPI)
```

## Repositories

| Folder | Stack | Purpose |
|---|---|---|
| `clinic-api/` | Java 21, Spring Boot | Backend REST API + FHIR integration |
| `clinic-web/` | Angular 21 | Frontend UI (future) |
| `infra/` | Docker Compose | HAPI FHIR server + PostgreSQL |
| `docs/` | Markdown | Architecture and design docs |

## Development Setup

### Prerequisites

- Java 21
- Docker
- Node.js 18+ (required for Husky pre-commit hooks)

### Clone and install hooks

```bash
git clone <repo-url>
cd clinic-fhir-system
npm install        # installs Husky and registers the pre-commit hook
```

The pre-commit hook runs automatically on every `git commit`. It:
- Formats staged `.java` files using **Spotless** (google-java-format, GOOGLE style)
- Formats staged Angular files (`.ts`, `.html`, `.scss`) using **Prettier** — activates once `clinic-web/` is initialized

To format Java manually at any time:
```bash
cd clinic-api
./mvnw spotless:apply   # format
./mvnw spotless:check   # check only (useful in CI)
```

---

## Quick Start

### 1. Start infrastructure

```bash
cd infra
docker compose up -d
```

This starts:
- **PostgreSQL 15** at `localhost:5432` — persistent data stored in Docker volume `infra_postgres-data`
- **HAPI FHIR JPA Server (R4)** at `http://localhost:8080/fhir` — stateless, all data lives in Postgres

Both services have healthchecks configured. HAPI FHIR takes ~60 seconds to fully initialize on first boot. Check container health with:

```bash
docker compose ps
```

Verify FHIR server is ready (returns a CapabilityStatement JSON):
```
GET http://localhost:8080/fhir/metadata
```

**Data persistence:** stopping containers with `docker compose down` preserves all data. Use `docker compose down -v` only if you want to wipe the database.

**To stop the infrastructure:**
```bash
cd infra
docker compose down        # stop, keep data
docker compose down -v     # stop and delete all data
```

### 2. Run the backend

```bash
cd clinic-api
./mvnw spring-boot:run
```

API runs at `http://localhost:9090`

### 3. Test with Postman

```
POST http://localhost:9090/api/patients
{
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-05-15",
  "gender": "male",
  "phone": "9876543210"
}
```

## Features

- Register and manage patients (FHIR `Patient`)
- Record patient visits / encounters (FHIR `Encounter`)
- Store vitals — Blood Pressure, Weight, SpO2 (FHIR `Observation` with LOINC codes)
- Patient summary aggregation endpoint
- Full FHIR R4 compliance via HAPI FHIR

## Tech Stack

- **Backend:** Java 21, Spring Boot 3, HAPI FHIR Client 7.4
- **FHIR Server:** HAPI FHIR JPA Server (R4)
- **Database:** PostgreSQL 15
- **Frontend:** Angular 21 (planned)
- **Infra:** Docker Compose

## Docs

See [`docs/`](./docs) for full system design:

- [Architecture](./docs/00-architecture.md)
- [Module Design](./docs/01-module-design.md)
- [API Design](./docs/02-api-design.md)
- [FHIR Mapping](./docs/03-fhir-mapping.md)
- [Key Flows](./docs/04-key-flows.md)
- [Database Internals](./docs/05-database.md)
- [MVP Plan](./docs/06-mvp-plan.md)
- [Best Practices](./docs/07-best-practices.md)
