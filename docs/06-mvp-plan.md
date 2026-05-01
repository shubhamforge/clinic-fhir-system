# MVP Plan

Target: 1–2 weeks. Single Spring Boot monolith. No microservices yet.

---

## Phase 1 — Foundation (Days 1–2)

- [x] Create Spring Boot project via [start.spring.io](https://start.spring.io)
  - Dependencies: `spring-web`, `spring-boot-starter-validation`, `lombok`
- [x] Add HAPI FHIR dependencies to `pom.xml`
  ```xml
  <dependency>
      <groupId>ca.uhn.hapi.fhir</groupId>
      <artifactId>hapi-fhir-client</artifactId>
      <version>7.4.0</version>
  </dependency>
  <dependency>
      <groupId>ca.uhn.hapi.fhir</groupId>
      <artifactId>hapi-fhir-structures-r4</artifactId>
      <version>7.4.0</version>
  </dependency>
  ```
- [x] Run HAPI FHIR + PostgreSQL via `infra/docker-compose.yml`
- [x] Verify: `GET http://localhost:8080/fhir/metadata` returns CapabilityStatement
- [x] Implement `FhirConfig` → wire `IGenericClient` bean + `FhirHttpMessageConverter`
- [x] Implement `PatientController` → `PatientService` → `PatientMapper`
- [x] Test: POST patient, GET patient by ID via Postman

---

## Phase 2 — Core Clinical (Days 3–5)

- [x] Implement `EncounterController` → `EncounterService` → `EncounterMapper`
- [x] Implement `VitalsController` → `VitalsService` → `ObservationMapper`
  - Support all 4 vitals: BP systolic, BP diastolic, weight, SpO2
  - Use correct LOINC codes (see `03-fhir-mapping.md`)
- [x] Link vitals to an encounter via `Observation.encounter` reference
- [ ] Test: Create encounter for patient, record vitals, verify in HAPI directly

---

## Phase 3 — Summary & Polish (Days 6–7)

- [x] Implement `SummaryService` (3-call FHIR aggregation → returns `Bundle`)
- [x] Add `GlobalExceptionHandler` (404, FHIR errors, validation errors)
- [x] Add patient search endpoint (`?name=&dob=`)
- [x] Add `application.yaml` with configurable `fhir.server.url`
- [x] Write `README.md` quick-start instructions
- [x] Load synthetic seed data via Synthea pipeline
- [x] Add `seed-demo-data` Nx app — Cucumber-driven, idempotent, relative-date seed data

---

## Phase 4 — Frontend (care-platform)

- [x] Bootstrap Angular Material M3 shell + theme (clinician-app)
- [x] Patient roster — searchable `mat-table` with live data from `/api/patients`
- [x] Patient detail page — 3-panel layout with ApexCharts vitals timeline
- [x] Top navigation header replacing sidebar
- [ ] Encounter list in patient detail
- [ ] CORS configuration (needed for any non-proxied deployment)
- [ ] Auth / JWT

---

## Postpone (Post-MVP)

| Feature | Reason to Postpone |
|---|---|
| Patient `PUT` update | Read-then-update pattern adds complexity |
| Pagination on search | Not needed for demo data volume |
| Spring Security / JWT | Adds significant setup without portfolio value at this stage |
| patient-app features | Scaffolded; clinician-app is the active app |

---

## Skip Entirely (Not in Scope)

- FHIR Subscriptions / webhooks
- CDS Hooks
- SMART on FHIR
- Bulk data export (`$export`)
- HL7 v2 message handling

---

## Milestone Checklist

```
Week 1
  ✓ HAPI FHIR + Postgres running locally
  ✓ Patient create + read working
  ✓ Encounter create + read working
  ✓ Vitals create + read working (all LOINC codes correct)

Week 2
  ✓ Patient summary endpoint working
  ✓ Error handling polished
  ✓ FHIR R4 native responses (application/fhir+json)
  ✓ Seed data pipeline (Synthea → HAPI FHIR)
  ✓ README and docs complete
  ○ End-to-end Postman smoke test (pending infra start)
  ○ Push to GitHub

Frontend (care-platform)
  ✓ Angular Material M3 shell + theme (clinician-app)
  ✓ Patient roster (mat-table, live API data)
  ✓ Patient detail page (ApexCharts vitals timeline)
  ✓ seed-demo-data app (Cucumber, idempotent, 5 patient profiles)
  ○ Encounter list in patient detail
  ○ CORS config
  ○ Auth / JWT
```
