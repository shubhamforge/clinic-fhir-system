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
    config/         FhirConfig, FhirHttpMessageConverter
    controller/     PatientController, EncounterController, VitalsController
    service/        PatientService, EncounterService, VitalsService, SummaryService
    mapper/         PatientMapper, EncounterMapper, ObservationMapper
    dto/            PatientRequest, EncounterRequest, VitalsRequest  (Java records)
    exception/      ResourceNotFoundException, GlobalExceptionHandler
  seed-data/        13 Synthea FHIR R4 patient bundles + load.sh
  integration-tests/ Postman collection

care-platform/      Angular 21 Nx monorepo
  apps/clinician-app/   Clinician-facing UI (active development)
  apps/patient-app/     Patient-facing UI (scaffolded, empty)
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
  06-mvp-plan.md        MVP checklist (backend complete, frontend in progress)
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
bash clinic-api/seed-data/load.sh   # loads 13 Synthea patients into HAPI FHIR
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
All endpoints return native FHIR R4 with `Content-Type: application/fhir+json`. Serialization is handled by `FhirHttpMessageConverter` (registers `IParser` per request — not thread-safe, never share instances).

- `POST`, `GET /{id}` → single resource (`Patient`, `Encounter`, `Observation`)
- Search / aggregation → `Bundle` (`type: searchset` from HAPI, `type: collection` for multi-resource aggregations)

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

---

## REST API Reference

Base URL: `http://localhost:9090`

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/patients` | Register patient |
| `GET` | `/api/patients/{id}` | Get patient |
| `GET` | `/api/patients?name=&dob=` | Search patients |
| `GET` | `/api/patients/{id}/summary` | Full summary (Patient + Encounters + Observations) |
| `POST` | `/api/encounters` | Record visit |
| `GET` | `/api/encounters/{id}` | Get encounter |
| `GET` | `/api/encounters?patientId={id}` | List encounters |
| `POST` | `/api/vitals` | Record vitals (null fields skipped) |
| `GET` | `/api/vitals?patientId={id}` | All vitals for patient |
| `GET` | `/api/vitals?patientId={id}&type=weight` | Filter by type (`systolic`, `diastolic`, `weight`, `spo2`) |

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

**Backend (clinic-api):** MVP complete. All endpoints implemented and manually tested via Postman. Synthea seed data loaded.

**Frontend (care-platform):** In progress. `clinician-app` has shell layout, patient roster, and patient detail page with ApexCharts vitals timeline. Next logical features: encounter list in patient detail, CORS config.

**Seed data:** `apps/seed-demo-data` — Cucumber-driven app with 5 idempotent patient profiles (encounters + vitals, relative dates). Run: `npx nx run seed-demo-data:seed`.

**Pending from MVP plan:**
- End-to-end Postman smoke test (infra must be running)
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
