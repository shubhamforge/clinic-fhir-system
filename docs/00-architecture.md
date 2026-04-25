# Architecture

## System Overview

```
Client (Postman / Angular)
        ↓  REST JSON
clinic-api  (Spring Boot)
        ↓  FHIR REST (HTTP/JSON)
HAPI FHIR JPA Server
        ↓  JPA/JDBC
PostgreSQL
```

## Component Responsibilities

### clinic-api (Spring Boot)
- Accepts plain business DTOs from the client
- Validates input using Bean Validation (`@Valid`, `@NotBlank`)
- Converts DTOs → FHIR resources via mappers
- Calls HAPI FHIR server over HTTP using `IGenericClient`
- Converts FHIR responses → DTOs and returns to client

Spring Boot is **not** a pass-through proxy. It owns all business logic and validation. FHIR types never reach the client.

### HAPI FHIR JPA Server
- Runs as a separate process on `http://localhost:8080/fhir`
- Accepts FHIR REST operations (create, read, search, update)
- Validates FHIR resource structure
- Manages all persistence to PostgreSQL

### PostgreSQL
- Owned entirely by HAPI FHIR — Spring Boot does NOT query it directly
- All data access goes through the FHIR server's REST API

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Spring Boot as business layer, not proxy | Business validation, DTO translation, and error handling belong here |
| HAPI FHIR as separate process | Keeps FHIR compliance and storage concerns isolated |
| No direct DB access from Spring Boot | FHIR server is the single source of truth; bypassing it breaks FHIR semantics |
| FHIR types hidden from API consumers | Clients work with clean JSON DTOs, not FHIR structures |
