# Key Flows

---

## Flow 1: Register Patient

```
POST /api/patients  { firstName, lastName, dateOfBirth, gender, phone }
  │
  ├─ PatientController.createPatient(@Valid dto)
  │
  ├─ PatientService.createPatient(dto)
  │     ├─ PatientMapper.toFhir(dto)            → builds FHIR Patient resource
  │     ├─ fhirClient.create()
  │     │       .resource(fhirPatient)
  │     │       .execute()                      → POST to HAPI FHIR
  │     │       returns MethodOutcome (has new ID)
  │     └─ fhirClient.read().withId(id)         → fetch saved Patient resource
  │
  └─ 201 Created  { "resourceType": "Patient", "id": "123", ... }
```

---

## Flow 2: Record a Visit (Encounter)

```
POST /api/encounters  { patientId: "123", visitDate, reason, status }
  │
  ├─ EncounterController → EncounterService.createEncounter(dto)
  │     ├─ EncounterMapper.toFhir(dto)
  │     │     sets subject = Reference("Patient/123")
  │     ├─ fhirClient.create().resource(encounter).execute()
  │     └─ fhirClient.read().withId(id)         → fetch saved Encounter resource
  │
  └─ 201 Created  { "resourceType": "Encounter", "id": "456", ... }
```

---

## Flow 3: Add Vitals

```
POST /api/vitals  { patientId: "123", encounterId: "456",
                    weightKg: 72.5, spo2Percent: 98.0 }
  │
  ├─ VitalsController → VitalsService.recordVitals(dto)
  │     │
  │     ├─ ObservationMapper.toFhirObservations(dto)
  │     │     → List<Observation> (one per non-null field, with LOINC codes)
  │     │
  │     ├─ for each Observation:
  │     │     fhirClient.create().resource(obs).execute()
  │     │     fhirClient.read().withId(id)       → fetch saved Observation
  │     │     add to Bundle (type: collection)
  │     │
  │     └─ return Bundle
  │
  └─ 201 Created  { "resourceType": "Bundle", "type": "collection", "entry": [...] }
```

---

## Flow 4: Fetch Patient Summary (Aggregation)

```
GET /api/patients/123/summary
  │
  ├─ PatientController → SummaryService.getSummary("123")
  │     │
  │     ├─ PatientService.getPatient("123")
  │     │     fhirClient.read().resource(Patient.class).withId("123")
  │     │
  │     ├─ EncounterService.getEncountersForPatient("123")
  │     │     fhirClient.search().forResource(Encounter)
  │     │       .where(subject = Patient/123) → Bundle
  │     │
  │     ├─ VitalsService.getVitals("123", null)
  │     │     fhirClient.search().forResource(Observation)
  │     │       .where(subject = Patient/123) → Bundle
  │     │
  │     └─ Build Bundle (type: collection):
  │           entry[0] = Patient
  │           entry[1..n] = Encounters
  │           entry[n+1..] = Observations
  │
  └─ 200 OK  { "resourceType": "Bundle", "type": "collection", "entry": [...] }
```

**Note:** These 3 FHIR calls are sequential in MVP. In production, they can be parallelised with `CompletableFuture` or replaced with a single FHIR `$everything` operation.

---

## Flow 5: Error — Patient Not Found

```
GET /api/patients/999
  │
  ├─ PatientService.getPatient("999")
  │     fhirClient.read().resource(Patient.class).withId("999").execute()
  │     HAPI throws ResourceNotFoundException (HTTP 404)
  │     caught → rethrown as domain ResourceNotFoundException
  │
  ├─ GlobalExceptionHandler.handleNotFound(ex)
  │
  └─ 404 Not Found  { "status": 404, "message": "Patient with id '999' not found" }
```
