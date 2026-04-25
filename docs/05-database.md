# Database Internals

HAPI FHIR manages PostgreSQL entirely. Spring Boot (clinic-api) never queries the database directly.

---

## HAPI FHIR Table Structure

HAPI does NOT use one table per resource type. It uses a **normalized EAV-style schema**:

| Table | Purpose |
|---|---|
| `HFJ_RESOURCE` | One row per resource — stores `id`, `res_type`, `res_version`, `res_updated` |
| `HFJ_RES_VER` | Full serialized JSON/XML of **every version** of every resource |
| `HFJ_SPIDX_STRING` | String search indexes — e.g., patient family name, given name |
| `HFJ_SPIDX_DATE` | Date search indexes — e.g., `birthDate`, `effectiveDateTime` |
| `HFJ_SPIDX_TOKEN` | Token indexes — e.g., LOINC codes, status values, identifiers |
| `HFJ_SPIDX_QUANTITY` | Quantity indexes — e.g., `Observation.valueQuantity` |
| `HFJ_RES_LINK` | Reference links between resources — e.g., Observation → Patient |

---

## Why This Design?

**FHIR resources have deeply varying structures.** A `Patient` resource has names, addresses, and telecom. An `Observation` has coded values and quantities. An `Encounter` has periods and reasons. A single relational table per type would require dozens of nullable columns and would be unmaintainable.

HAPI solves this by:
1. Storing the full resource as serialized JSON in `HFJ_RES_VER` (source of truth)
2. Extracting searchable fields into typed index tables at write time
3. Using those index tables for queries — never parsing JSON at query time

---

## How Search Works Internally

When you call:
```java
fhirClient.search()
    .forResource(Observation.class)
    .where(Observation.PATIENT.hasId("123"))
    .returnBundle(Bundle.class).execute();
```

HAPI executes roughly:
```sql
-- Step 1: find Observation resources linked to Patient/123
SELECT res_id FROM HFJ_RES_LINK
WHERE src_resource_type = 'Observation'
  AND target_resource_id = 123;

-- Step 2: fetch full JSON for each result
SELECT res_text FROM HFJ_RES_VER
WHERE res_id IN (...)
  AND res_deleted_at IS NULL;
```

Then deserializes JSON into FHIR `Observation` objects and returns them.

---

## Versioning

Every update to a resource creates a new row in `HFJ_RES_VER`. The current version is tracked in `HFJ_RESOURCE.res_version`. Old versions remain accessible via:
```
GET /fhir/Patient/123/_history/1
GET /fhir/Patient/123/_history/2
```

This is built-in — you get full audit history for free.

---

## What You Don't Need to Do

- No Flyway/Liquibase migrations — HAPI manages schema creation
- No `@Entity` classes — no JPA in clinic-api
- No `application.datasource` in clinic-api — only in HAPI's config
- No SQL — all data access is through FHIR REST operations
