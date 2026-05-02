# clinic-fhir-system — Claude Context

A portfolio/learning project: a FHIR-compliant clinic management system built with Java 21, Spring Boot, HAPI FHIR, and Angular 21.

---

## Architecture

```
Angular (care-platform/)
    ↓ REST JSON  (proxy → localhost:9090)
clinic-api  (Spring Boot 3.5 / Java 21, port 9090)
    ↓ FHIR REST HTTP
HAPI FHIR JPA Server v7.4.0  (port 8080)
    ↓ JPA
PostgreSQL 15  (owned entirely by HAPI — Spring Boot never queries it directly)
```

**Spring Boot is not a pass-through proxy.** It owns all business logic, DTO validation, and DTO↔FHIR mapping. FHIR types never reach the HTTP client.

---

## Repository Layout

```
clinic-api/         Spring Boot backend (Maven)
  src/main/java/io/github/shubhamforge/clinic/
    config/         FhirConfig, FhirHttpMessageConverter, ClinicalThresholds
    controller/     PatientController, EncounterController, VitalsController,
                    PractitionerController, ConditionController, MedicationController,
                    AppointmentController, ServiceRequestController,
                    DiagnosticReportController, CarePlanController, GoalController,
                    DashboardController
    service/        PatientService, EncounterService, VitalsService, SummaryService,
                    PractitionerService, ConditionService, MedicationService,
                    AppointmentService, ServiceRequestService, DiagnosticReportService,
                    CarePlanService, GoalService,
                    SnapshotService, TrendsService, TimelineService,
                    DashboardService, ConditionEvaluationService
    mapper/         PatientMapper, EncounterMapper, ObservationMapper,
                    PractitionerMapper, ConditionMapper, MedicationMapper,
                    AppointmentMapper, ServiceRequestMapper, DiagnosticReportMapper,
                    CarePlanMapper, GoalMapper
    dto/            PatientRequest, EncounterRequest, VitalsRequest,
                    PractitionerRequest, ConditionRequest, MedicationRequest,
                    AppointmentRequest, ServiceRequestRequest, DiagnosticReportRequest,
                    CarePlanRequest, GoalRequest,
                    SnapshotResponse, TrendsResponse, TimelineEvent, DashboardResponse,
                    AlertItem, VitalReading, LatestVitals, GoalProgress,
                    DataPoint, BpSeries, SimpleSeries  (all Java records)
    exception/      ResourceNotFoundException, ReferenceValidationException,
                    GlobalExceptionHandler
  seed-data/        13 Synthea FHIR R4 patient bundles + load.sh
  integration-tests/ Postman collection

care-platform/      Angular 21 Nx monorepo
  apps/clinician-app/   Clinician-facing UI (active development)
  apps/patient-app/     Patient-facing UI (scaffolded, empty)
  apps/seed-demo-data/  Cucumber-driven idempotent seed data (5 patient profiles)
    src/features/       marcus-webb.feature, priya-nair.feature, gerald-horton.feature,
                        sandra-okafor.feature, ramon-castillo.feature
    src/step-definitions/  background.steps.ts, patient.steps.ts, encounter.steps.ts,
                           vitals.steps.ts, clinical.steps.ts
    src/support/        api-client.ts, world.ts, date-helpers.ts
  libs/design-system/   SCSS tokens + palette + global utilities (planned)
  libs/ui/              Shared Angular components (planned)
  libs/shared/          ThemeService, FHIR model types (planned)

infra/
  docker-compose.yml    HAPI FHIR + PostgreSQL 15

docs/
  00-architecture.md    System design
  01-module-design.md   Package structure + layer rules
  02-api-design.md      Full REST API reference with request/response shapes
  03-fhir-mapping.md    DTO→FHIR field mappings + LOINC codes
  04-key-flows.md       Sequence diagrams
  05-database.md        PostgreSQL internals (HAPI-owned)
  06-mvp-plan.md        MVP checklist
  07-best-practices.md  Spring + FHIR patterns
  08-design-system.md   Angular Material M3 design system spec
```

---

## Development Commands

### Infrastructure (run from project root)
```bash
docker compose -f infra/docker-compose.yml up -d    # start HAPI FHIR + Postgres
docker compose -f infra/docker-compose.yml down     # stop (keep data)
docker compose -f infra/docker-compose.yml down -v  # stop + wipe data
```

### clinic-api (run from clinic-api/)
```bash
# Linux/Mac
./mvnw spring-boot:run
./mvnw clean package
./mvnw test
./mvnw spotless:apply   # format Java (Google style)
./mvnw spotless:check

# Windows
mvnw.cmd spring-boot:run
mvnw.cmd spotless:apply
```

### care-platform (run from care-platform/)
```bash
npx nx serve clinician-app    # dev server — proxies /api → localhost:9090
npx nx serve patient-app
npx nx build clinician-app
npx nx test clinician-app
```

### Seed data
```bash
bash clinic-api/seed-data/load.sh           # loads 13 Synthea patients into HAPI FHIR
npx nx run seed-demo-data:seed              # idempotent Cucumber seed — 5 realistic patients
```

---

## Backend Conventions (Java / Spring Boot)

- **DTOs** are Java `record` types. Use `@NotBlank`, `@NotNull` from `jakarta.validation`. Annotate controller params with `@Valid`.
- **Controllers** do HTTP routing only — `@RestController`, `@RequestMapping`, `ResponseEntity<T>`. No business logic.
- **Services** hold business logic. Constructor injection only (no `@Autowired` on fields). Inject `IGenericClient` + mapper.
- **Mappers** are `@Component` classes. FHIR types (`org.hl7.fhir.r4.model.*`) are confined here and in services — **never in controller signatures or DTOs**.
- **Config** uses `@Configuration` + `@Bean`. `IGenericClient` is thread-safe; one shared bean.
- **Error response shape**: `{ "status": int, "message": String }` — plain JSON, not FHIR.
- **`ResourceNotFoundException(resourceType, id)`** — throw when HAPI returns 404.
- **Logging**: `@Slf4j` (Lombok). Avoid `@Data` on mutable entities.
- **Formatting**: Google Java Format via Spotless. Run `./mvnw spotless:apply` before committing. Enforced by Husky pre-commit hook.
- **No comments** unless the WHY is non-obvious.

### Response format
- **FHIR CRUD endpoints** return native FHIR R4 with `Content-Type: application/fhir+json`. Serialization handled by `FhirHttpMessageConverter` (per-request `IParser` — not thread-safe, never share).
  - `POST`, `GET /{id}` → single FHIR resource
  - `GET ?query` → `Bundle` (`searchset` from HAPI, `collection` for manual aggregations)
- **Experience API endpoints** (`/snapshot`, `/trends`, `/timeline`, `/dashboard`) return plain JSON POJOs (`Content-Type: application/json`). These are flat DTOs, not FHIR resources.

---

## FHIR Mapping Rules

All resources use **FHIR R4**. FHIR server: `http://localhost:8080/fhir` (configured in `application.yaml` as `fhir.server.url`).

### Patient
| Request field | FHIR path |
|---|---|
| `firstName` + `lastName` | `Patient.name[0]` (HumanName) |
| `dateOfBirth` | `Patient.birthDate` |
| `gender` | `Patient.gender` (AdministrativeGender enum) |
| `phone` | `Patient.telecom[system=phone]` |
| `email` | `Patient.telecom[system=email]` |

### Encounter
| Request field | FHIR path |
|---|---|
| `patientId` | `Encounter.subject` → `Patient/{id}` |
| `visitDate` | `Encounter.period.start` |
| `reason` | `Encounter.reasonCode[0].text` |
| `status` | `Encounter.status` |

### Vitals — each vital is a **separate Observation** (FHIR standard)
| Vital | LOINC code | Unit |
|---|---|---|
| Systolic BP | `8480-6` | `mm[Hg]` |
| Diastolic BP | `8462-4` | `mm[Hg]` |
| Weight | `29463-7` | `kg` |
| SpO2 | `59408-5` | `%` |

LOINC system URI: `http://loinc.org`. Units system: `http://unitsofmeasure.org`. Status always `final`.

### Encounter (updated)
| Request field | FHIR path |
|---|---|
| `patientId` | `Encounter.subject` → `Patient/{id}` |
| `visitDate` | `Encounter.period.start` |
| `reason` | `Encounter.reasonCode[0].text` |
| `status` | `Encounter.status` |
| `practitionerId` *(optional)* | `Encounter.participant[type=ATND].individual` → `Practitioner/{id}` |

### Condition
| Request field | FHIR path |
|---|---|
| `patientId` | `Condition.subject` |
| `encounterId` *(optional)* | `Condition.encounter` |
| `code` | `Condition.code.coding[0].code` |
| `display` | `Condition.code.text` |
| `clinicalStatus` | `Condition.clinicalStatus` (system: `http://terminology.hl7.org/CodeSystem/condition-clinical`) |
| `onsetDate` | `Condition.onsetDateTime` |

### MedicationStatement
| Request field | FHIR path |
|---|---|
| `patientId` | `MedicationStatement.subject` |
| `medicationName` | `MedicationStatement.medication[CodeableConcept].text` |
| `status` | `MedicationStatement.status` |
| `dosageText` | `MedicationStatement.dosage[0].text` |
| `startDate` | `MedicationStatement.effective[Period].start` |

### Appointment
| Request field | FHIR path |
|---|---|
| `patientId` | `Appointment.participant[actor=Patient]` |
| `practitionerId` *(optional)* | `Appointment.participant[actor=Practitioner]` |
| `start` / `end` | `Appointment.start` / `Appointment.end` |
| `description` | `Appointment.description` |
| `status` | `Appointment.status` |

### ServiceRequest
| Request field | FHIR path |
|---|---|
| `patientId` | `ServiceRequest.subject` |
| `encounterId` *(optional)* | `ServiceRequest.encounter` |
| `practitionerId` *(optional)* | `ServiceRequest.requester` |
| `code` | `ServiceRequest.code.text` |
| `category` | `ServiceRequest.category[0].text` |
| `status` | `ServiceRequest.status` (`active` → `completed` when DiagnosticReport is created) |
| `priority` | `ServiceRequest.priority` |
| `authoredOn` | `ServiceRequest.authoredOn` |

### DiagnosticReport
| Request field | FHIR path |
|---|---|
| `patientId` | `DiagnosticReport.subject` |
| `encounterId` *(optional)* | `DiagnosticReport.encounter` |
| `serviceRequestId` *(optional)* | `DiagnosticReport.basedOn[0]` — also auto-marks ServiceRequest `completed` |
| `title` | `DiagnosticReport.code.text` |
| `status` | `DiagnosticReport.status` |
| `issued` | `DiagnosticReport.issued` |
| `conclusion` | `DiagnosticReport.conclusion` |
| `resultIds[]` | `DiagnosticReport.result[]` → Observation references |

### CarePlan
| Request field | FHIR path |
|---|---|
| `patientId` | `CarePlan.subject` |
| `conditionIds[]` | `CarePlan.addresses[]` → Condition references |
| `title` | `CarePlan.title` |
| `status` | `CarePlan.status` |
| `periodStart` | `CarePlan.period.start` |
| `goalIds[]` | `CarePlan.goal[]` → Goal references |

### Goal
| Request field | FHIR path |
|---|---|
| `patientId` | `Goal.subject` |
| `description` | `Goal.description.text` |
| `status` | `Goal.lifecycleStatus` |
| `targetMeasureCode` | `Goal.target[0].measure.coding[0].code` (LOINC) |
| `targetValue` | `Goal.target[0].detail[Quantity]` |
| `targetDate` | `Goal.target[0].due[DateType]` |

### Practitioner
| Request field | FHIR path |
|---|---|
| `firstName` + `lastName` | `Practitioner.name[0]` (HumanName) |
| `specialty` | `Practitioner.qualification[0].code.text` |
| `npi` *(optional)* | `Practitioner.identifier[system=NPI]` |
| `email` *(optional)* | `Practitioner.telecom[system=email]` |

### Alert thresholds (`ClinicalThresholds` config, `application.yaml`)
| Property | Default | Meaning |
|---|---|---|
| `clinical.thresholds.systolic-warn` | `140` | Systolic BP warning level |
| `clinical.thresholds.systolic-critical` | `180` | Systolic BP critical level |
| `clinical.thresholds.diastolic-warn` | `90` | Diastolic BP warning level |
| `clinical.thresholds.diastolic-critical` | `120` | Diastolic BP critical level |
| `clinical.thresholds.spo2-warn` | `95.0` | SpO2 warning level (below) |
| `clinical.thresholds.spo2-critical` | `90.0` | SpO2 critical level (below) |
| `clinic.default-org-id` | `seed-default-org` | HAPI FHIR Organization ID for care team |

---

## REST API Reference

Base URL: `http://localhost:9090`

### FHIR CRUD — return `application/fhir+json`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/patients` | Register patient |
| `GET` | `/api/patients/{id}` | Get patient |
| `GET` | `/api/patients?name=&dob=` | Search patients |
| `GET` | `/api/patients/{id}/summary` | Legacy FHIR Bundle summary (Patient + Encounters + Observations) |
| `POST` | `/api/encounters` | Record visit (optional `practitionerId`) |
| `GET` | `/api/encounters/{id}` | Get encounter |
| `GET` | `/api/encounters?patientId={id}` | List encounters |
| `POST` | `/api/vitals` | Record vitals — auto-evaluates conditions on creation |
| `GET` | `/api/vitals?patientId={id}` | All vitals for patient |
| `GET` | `/api/vitals?patientId={id}&type=weight` | Filter by type (`systolic`, `diastolic`, `weight`, `spo2`) |
| `POST` | `/api/practitioners` | Register practitioner |
| `GET` | `/api/practitioners/{id}` | Get practitioner |
| `POST` | `/api/conditions` | Record diagnosis |
| `GET` | `/api/conditions/{id}` | Get condition |
| `GET` | `/api/conditions?patientId={id}` | List conditions |
| `POST` | `/api/medications` | Record medication |
| `GET` | `/api/medications?patientId={id}` | List medications |
| `POST` | `/api/appointments` | Schedule appointment |
| `GET` | `/api/appointments?patientId={id}` | List appointments |
| `POST` | `/api/service-requests` | Place lab/imaging order |
| `GET` | `/api/service-requests/{id}` | Get order |
| `GET` | `/api/service-requests?patientId={id}&status=active` | List orders (optional status filter) |
| `POST` | `/api/diagnostic-reports` | Create report (auto-completes linked ServiceRequest) |
| `GET` | `/api/diagnostic-reports?patientId={id}` | List reports |
| `POST` | `/api/care-plans` | Create care plan |
| `GET` | `/api/care-plans?patientId={id}` | List care plans |
| `POST` | `/api/goals` | Create goal |
| `GET` | `/api/goals?patientId={id}` | List goals |

### Experience APIs — return `application/json` (flat DTOs, not FHIR)

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard/{patientId}` | Full clinical dashboard — partial-failure safe, `_warnings[]` on degraded sections |
| `GET` | `/api/patients/{id}/snapshot` | At-a-glance: active conditions, meds, latest vitals, alerts |
| `GET` | `/api/patients/{id}/trends?type=bp,spo2,weight&period=30d` | Chart-ready vitals series; `bp` returns paired systolic+diastolic |
| `GET` | `/api/patients/{id}/timeline?limit=20&before=2026-05-01&types=encounter,report` | Unified chronological event feed with cursor pagination |

---

## Frontend Conventions (Angular / care-platform)

### Stack
- Angular 21, Angular Material M3 (`@angular/material ~21.2.0`)
- Nx monorepo (`npx nx` for all tasks)
- Prettier enforced via Husky pre-commit hook
- UI/UX design decisions use the `/ui-ux-pro-max` skill — invoke it for new screens, component design, layout, color, and accessibility work

### Two-app model
| | `clinician-app` | `patient-app` |
|---|---|---|
| Density | `-1` (compact) | `0` (comfortable) |
| Nav | `mat-sidenav` persistent sidebar | `mat-tab-nav-bar` bottom tabs |
| Data display | `mat-table` + `matSort` + `matPaginator` | `mat-card` stacked list |
| Forms | Reactive forms, validate `on blur` | `mat-stepper` linear flow |

### Design system rules
- **Never reimplement Angular Material components.** No custom button heights, input styles, or card borders via raw CSS.
- All overrides go through `mat.define-theme()` or Angular Material's supported CSS custom property API. Never target `.mdc-*` internal classes.
- SCSS tokens are `$cp-{category}-{modifier}` (e.g. `$cp-blue-500`, `$cp-space-4`). No raw hex in component SCSS — use tokens.
- CSS utility classes: `.cp-{purpose}` prefix only.
- Status badges: `.cp-status-badge--success/warning/critical/info` — used for inline chips only. Full notifications use `MatSnackBar`.
- Monospace class `.cp-font-mono` for vital readings, lab values, IDs.
- Angular component selectors: `cp-{name}`. Component classes: `Cp{Name}Component`.
- Nx library imports: `@care-platform/{lib}`.
- Dark mode via `[data-theme="dark"]` on `<html>` — toggled by `ThemeService`, respects `prefers-color-scheme`.

### Component styling pattern

**What belongs in a component `.scss` file:**
- Structural/layout styles only: flex, grid, positioning, width, height, padding, gap.
- Never colors, font families, or font sizes — those come from Material system tokens or global utilities.

**Colors — always `var(--mat-sys-*)`:**
```scss
// correct
border-right: 1px solid var(--mat-sys-outline-variant);
color: var(--mat-sys-on-surface);
background: var(--mat-sys-surface);

// wrong — never do this
border-right: 1px solid #e2e8f0;
color: #334155;
```

**Global utilities — apply in templates, never redeclare in component SCSS:**
- `.cp-font-mono` — monospace for vitals, lab values, IDs
- `.cp-status-badge--{success|warning|critical|info}` — inline status chips
- `.cp-skip-link` — skip-to-content link
- `.cp-patient-content` — max-width container for patient app
- These are defined once in each app's `styles.scss`. Use them as HTML classes, don't copy into component files.

**`::ng-deep` — structural layout only:**
```scss
// permitted — reaching Material's generated wrapper for layout
::ng-deep .mat-drawer-content { display: flex !important; flex-direction: column; }

// not permitted — theming/color override
::ng-deep .mat-mdc-button { background: blue; }
```

**`!important` — Material specificity overrides only, with comment:**
```scss
// permitted — overcoming Material's component specificity for active state
:host ::ng-deep .nav-item--active {
  background: var(--mat-sys-secondary-container) !important; // needs !important to override mat-list-item base
}
```

**Dark mode — never add manually in component SCSS:**
- Handled automatically by `[data-theme='dark']` + `mat.all-component-themes()` in `styles.scss`.
- If you use `var(--mat-sys-*)` tokens, dark mode works for free.

**BEM naming:**
- App-specific: `.app-{block}`, `.app-{block}__{element}`, `.app-{block}--{modifier}`
- Shared lib components: `.cp-{name}` prefix

**Spacing — 4px grid, no arbitrary values:**
- Use: 4, 8, 12, 16, 24, 32, 48, 64 px
- Will be replaced by `$cp-space-*` tokens when `libs/design-system` is created

### Status
- **clinician-app**: M3 shell + theme bootstrapped; patient roster and patient detail page implemented.
- **patient-app**: Scaffolded, no feature code yet.
- **libs/design-system, libs/ui, libs/shared**: Defined in `docs/08-design-system.md` but not yet created on disk.

---

## Project Status (as of 2026-05-02)

**Backend (clinic-api):** Production-style clinical dashboard backend complete. 11 FHIR resource types, 4 experience APIs, clinical intelligence layer (auto-condition detection, goal progress evaluation), partial-failure-safe dashboard aggregation.

**Frontend (care-platform):** In progress. `clinician-app` has shell layout, patient roster, and patient detail page with ApexCharts vitals timeline. Next logical features: connect dashboard/snapshot/timeline/trends APIs to the frontend, encounter list, CORS config.

**Seed data:** `apps/seed-demo-data` — 5 idempotent patient profiles each in their own `.feature` file. Each patient has Encounters + Vitals + Condition + Medications + Appointment + ServiceRequest + DiagnosticReport + CarePlan + Goal. Run: `npx nx run seed-demo-data:seed`.

**Pending:**
- Wire new backend APIs to clinician-app frontend (dashboard panel, timeline, trends)
- Encounter list in patient detail view
- CORS config, auth/JWT (post-MVP)

---

## Key Rules (do not violate)

1. FHIR types (`org.hl7.fhir.r4.model.*`) never appear in controller signatures or DTOs.
2. Spring Boot never queries PostgreSQL directly — all data access goes through HAPI FHIR REST.
3. Do not reimplement Angular Material components with custom SCSS.
4. One shared `IGenericClient` bean (thread-safe). `IParser` instances are per-request (not thread-safe).
5. All request bodies annotated with `@Valid` at the controller.
6. Error responses are `{ "status": int, "message": String }` plain JSON, not FHIR OperationOutcome.
